const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const Schema = mongoose.Schema;

const app = express();
app.use(express.static("public"));

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb+srv://admin-iggy:Testing1234@cluster0.saqoi.mongodb.net/mealplannerDB", {useNewUrlParser: true,useUnifiedTopology: true});

// Schemas - can we create this in a different document to make the app.js smaller????
const sourceSchema = {
  name:{type:String,required:true},
  author:{type:String,required:true},
  alias:{type:String,required:true}
}

const Source = mongoose.model("Source",sourceSchema);

const recipeSchema = {
  source: {type: sourceSchema,required:true},
  sourceAlias:"",
  page: {type:Number,required:true},
  name: {type:String,required:true},
  quality:String,
  effort:String,
  time:String
};

const Recipe = mongoose.model("Recipe",recipeSchema);

const entrySchema = {
  date:{type:Date,required:true},
  meal:String,
  inOut:{type:Boolean,required:true},
  source: {type:sourceSchema,required:false}, //This will be selected from a drop down list
  page: Number, //Chosen by user
  recipe:{type:Schema.Types.ObjectId,ref:'Recipe',required:false},
  active:{type:Boolean,required:true}
}

const Entry = mongoose.model("Entry",entrySchema);

let entries = []; //This array will hold the entries that are displayed in the website table.
//I will probably need to add some db read, with some properties

app.get("/",function(req,res){

  Entry.find({active:true}).populate('recipe').sort({date:1}).exec(function(err,foundEntries){
    if(!err){
      if(foundEntries.length>0){
        entries = foundEntries
      };
      Source.find({}).exec(function(err,foundSources){
        if(!err){
          let sourceAlias = [];
          foundSources.forEach(function(source){
            sourceAlias.push(source.alias);
          });
          res.render("table",{entries:entries,sources:sourceAlias})
        }else{
          console.log(err);
        }
      })
    }else{
      console.log(err);
    }
  });


});

app.get("/add-book",function(req,res){
  res.render("addbook",{})
})

app.post("/add-book-entry",function(req,res){
  if(req.body.name!==""&&req.body.author!==""&&req.body.alias!==""){
    let newBook = new Source({
      name:req.body.name,
      author:req.body.author,
      alias:req.body.alias
    })
    newBook.save();
    res.redirect("/");
  }else{

  }
})

app.post("/new-single-entry",function(req,res){
  let myPromise = addDate();
  myPromise.then(function(value){
    res.redirect("/");
  },function(error){

  });
});

app.post("/new-week-entry",function(req,res){
    Entry.aggregate([
      {
        "$group":{
          "_id":null,
          "date":{"$max":"$date"}
        }
      }
    ]).exec(function(err,result){
      let lastDate = new Date();
      if(result[0]!==null&&result[0]!==undefined){
        let lastDate = result[0].date;
      };
      let daysToAdd = 7;
      let promises = [];
      for(var i=0;i<daysToAdd;i++){
        let newDate = new Date();
        newDate.setDate(lastDate.getDate()+1+i);
        let new_promise = addDate("Dinner",false,true,newDate);
        promises.push(new_promise);
        if(newDate.getDay()===6||newDate.getDay()===0){
          let other_promise=addDate("Dinner",true,true,newDate);
          promises.push(other_promise);
        }
      }
      Promise.all(promises).then((values) => {
        res.redirect("/");
      })
    });
})

function addDate(chosenMeal="Dinner",mealOverride=false,dateOverride=false,date=new Date){
  let promise = new Promise(function(myResolve,myReject){
    Entry.aggregate([
    {
      "$group":{
        "_id":null,
        "date":{"$max":"$date"}
      }
    }
  ]).exec(function(err,result){
    let newEntry = new Entry({
      date:date,
      active:true,
      inOut:true,
      meal:chosenMeal
    });
    if(result.length>0&&!dateOverride){
      newEntry.date.setDate(result[0].date.getDate()+1);
    }
      if((newEntry.date.getDay()===6||newEntry.date.getDay()===0)&&!mealOverride){
        newEntry.meal = "Lunch";
      };
      newEntry.save();
      dateAdded = newEntry.date;
      myResolve();
  });
});
return promise
}

//Post request for when an item changes in the table - this will do most of the logic required!
app.post("/table-change",function(req,res){
  console.log(req.body);

  Entry.findById(req.body.id,function(err,entry){
    let promises = [];
    if(!err){
      //Check whether item should be "deleted"
      if(req.body.activeCheckbox!==undefined){
        entry.active = false;
      }
      //Date update
      if(Date.parse(req.body.date)!==entry.date){
        entry.date = Date.parse(req.body.date);
      };
      //Meal update - direct, no warning
      if(req.body.meal!==""){
        entry.meal = req.body.meal
      };

      if(req.body.inOut!==undefined){
        entry.inOut = true;
      }else{
        entry.inOut = false;
      }
      //Some more complex logic here:
      let sourceAlias = ""
      if(entry.source!==undefined&&entry.source!==null){
        sourceAlias = entry.source.alias
      }

      if(req.body.source!==sourceAlias){
        let firstPromise=new Promise((myResolve,myReject)=>{Source.findOne({alias:req.body.source},function(err,foundSource){
          if(!err){
            console.log(foundSource);
            Entry.findByIdAndUpdate(req.body.id,{source:foundSource},function(err){
              if(!err){
                console.log("Sucessfully updated entry");
                myResolve();
              }else{
                console.log(err);
              }
            })
          }else{
            console.log(err);
          }
        })
      })
      promises.push(firstPromise);
      };

      if(req.body.page!==entry.page){
        entry.page = req.body.page;
      }

      //Update recipe
      if(req.body.source!==""&&req.body.page!==""){
        //There should be a recipe
        if(req.body.recipe==""||(req.body.source!==sourceAlias||req.body.page!==entry.page)){
          //There was no recipe here before, therefore needs to be either found in the DB or added
          //First, let's see if the recipe already exists
          let secondPromise = new Promise((myResolve,myReject)=>{ Recipe.find({sourceAlias:req.body.source,page:req.body.page},function(err,foundRecipes){
            if(!err){
              if(foundRecipes.length===0){
                //Recipe doesn't exists
                const newRecipe = new Recipe({
                  source: entry.source,
                  sourceAlias:entry.source.alias,
                  page: req.body.page,
                  name: "New Recipe",
                  quality:"N/A",
                  effort:"N/A",
                  time:"N/A"
                });
                newRecipe.save();
                Entry.findByIdAndUpdate(req.body.id,{recipe:newRecipe._id},function(err){
                  if(!err){
                    console.log("Succesfully updated entry");
                    myResolve();
                  }else{
                    console.log(err);
                  }
                })
              }else{
                //Recipe exists
                Entry.findByIdAndUpdate(req.body.id,{recipe:foundRecipes[0]._id},function(err){
                  if(!err){
                    console.log("Succesfully updated entry");
                    myResolve();
                  }else{
                    console.log(err);
                  }
                })
              }
            }else{
              console.log(err);
            }
          })
        });
        promises.push(secondPromise);
        }
      }else{
        //One of them is empty, if there is a recipe field in the entry erase it
        if(entry.recipe!==undefined){
          let thirdPromise = new Promise((myResolve,myReject)=>{Entry.findByIdAndUpdate(req.body.id,{recipe:undefined},function(err){
            if(!err){
              console.log("Succesfully updated entry");
              myResolve();
            }else{
              console.log(err);
            };
          })
      });
      promises.push(thirdPromise);
      };
    };

      //If there is a recipe, check all values and update accordingly
      if(req.body.recipe!==""&&entry.recipe!==undefined&&entry.recipe!==null){
        //Check all the values of the recipe
        let fourthPromise = new Promise((myResolve,myReject)=>{Recipe.findByIdAndUpdate(entry.recipe,{name:req.body.recipe,quality:req.body.quality,effort:req.body.effort,time:req.body.time},function(err){
          if(!err){
            console.log("Succesfully updated recipe");
            myResolve();
          }else{
            console.log(err);
          }
        });
      });
      promises.push(fourthPromise);
      };


      entry.save();
      Promise.all(promises).then((values) => {
        res.redirect("/");
      });

    }else{
    console.log(err);
    };


  });
  //   id: '60bb38b75492750830a21198'
})

app.post("/delete-entries",function(req,res){
  console.log(req);
  res.redirect("/");
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
