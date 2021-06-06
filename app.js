const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

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
  page: {type:Number,required:true},
  recipe: {type:String,required:true},
  quality:String,
  effort:String,
  time:String
};

const Recipe = mongoose.model("Recipe",recipeSchema);

const entrySchema = {
  date:{type:Date,required:true},
  meal:String,
  source: {type:sourceSchema,required:false}, //This will be selected from a drop down list
  page: Number, //Chosen by user
  recipe:{type:recipeSchema,required:false},
  //Upon source or page change, script checks whether recipe exists in database.
  //If Y: Reference ID to this entry
  //If N: Shows "Not found" in DB, if user updates text field, it then updates the recipe DB
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

  Entry.find({active:true},function(err,foundEntries){
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
    active:true
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
      //Some more complex logic here:

      if(req.body.source!==entry.source){
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
