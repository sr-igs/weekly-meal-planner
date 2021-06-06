const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const Schema = mongoose.Schema;

const app = express();
app.use(express.static("public"));

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://localhost:27017/mealplannerDB", {useNewUrlParser: true,useUnifiedTopology: true});

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

const first_book = new Source({
  name:"Storecupboard One Pound Meals",
  author:"Miguel Barclay",
  alias:"MB Pink"
});
// first_book.save();

let entries = []; //This array will hold the entries that are displayed in the website table.
//I will probably need to add some db read, with some properties

app.get("/",function(req,res){

  Entry.find({active:true}).populate('recipe').exec(function(err,foundEntries){
    if(!err){
      if(foundEntries.length>0){
        entries = foundEntries
      };
      res.render("table",{entries:entries})
    }else{
      console.log(err);
    }
  });


})

app.post("/new-single-entry",function(req,res){
  let newEntry = new Entry({
    date:new Date(),
    active:true,
    inOut:true
  })
    newEntry.save();
    res.redirect("/");
})

//Post request for when an item changes in the table - this will do most of the logic required!
app.post("/table-change",function(req,res){
  console.log(req.body);

  Entry.findById(req.body.id,function(err,entry){
    if(!err){
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
        Source.findOne({alias:req.body.source},function(err,foundSource){
          if(!err){
            console.log(foundSource);
            Entry.findByIdAndUpdate(req.body.id,{source:foundSource},function(err){
              if(!err){
                console.log("Sucessfully updated entry");
              }else{
                console.log(err);
              }
            })
          }else{
            console.log(err);
          }
        })
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
          Recipe.find({sourceAlias:req.body.source,page:req.body.page},function(err,foundRecipes){
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
                  }else{
                    console.log(err);
                  }
                })
              }else{
                //Recipe exists
                Entry.findByIdAndUpdate(req.body.id,{recipe:foundRecipes[0]._id},function(err){
                  if(!err){
                    console.log("Succesfully updated entry");
                  }else{
                    console.log(err);
                  }
                })
              }
            }else{
              console.log(err);
            }
          })
        }
      }else{
        //One of them is empty, if there is a recipe field in the entry erase it
        if(entry.recipe!==undefined){
          Entry.findByIdAndUpdate(req.body.id,{recipe:undefined},function(err){
            if(!err){
              console.log("Succesfully updated entry");
            }else{
              console.log(err);
            }
          })
        }
      };

      //If there is a recipe, check all values and update accordingly
      if(req.body.recipe!==""&&entry.recipe!==undefined&&entry.recipe!==null){
        //Check all the values of the recipe
        Recipe.findByIdAndUpdate(entry.recipe,{name:req.body.recipe,quality:req.body.quality,effort:req.body.effort,time:req.body.time},function(err){
          if(!err){
            console.log("Succesfully updated recipe");
          }else{
            console.log(err);
          }
        });
      };


      entry.save();
      res.redirect("/");

    }else{
      console.log(err);
    };


  });

  // date: '2021-06-05',
  //   meal: 'Lunch',
  //   source: '',
  //   page: '',
  //   recipeName: '',
  //   rating: '',
  //   effort: '',
  //   time: '',
  //   id: '60bb38b75492750830a21198'
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
