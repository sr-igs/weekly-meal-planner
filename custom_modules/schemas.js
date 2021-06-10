

exports.getSchemas = function(){
  const mongoose = require('mongoose');
  const Schema = mongoose.Schema;

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

  return({
    source:Source,
    entry:Entry,
    recipe:Recipe
  })
}
