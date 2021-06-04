const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

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
  recipe:{type:recipeSchema,required:true},
  active:{type:Boolean,required:true}
}

const Entry = mongoose.model("Entry",entrySchema);

const first_book = new Source({
  name:"Storecupboard One Pound Meals",
  author:"Miguel Barclay",
  alias:"MB Pink"
});
first_book.save();

const entries = []; //This array will hold the entries that are displayed in the website table.
//I will probably need to add some db read, with some properties

app.get("/",function(req,res){
  res.render("table",{entries:entries})
})

app.post("/new-single-entry",function(req,res){
  entries.push("Hello");
  res.redirect("/");
})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
