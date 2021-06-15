const mongoose = require('mongoose');
const customSchemas = require(__dirname+"/schemas.js");
const csv = require('csv-parser');
const fs = require("fs");

const createdSchemas = customSchemas.getSchemas();
const Source = createdSchemas.source;
const Recipe = createdSchemas.recipe;
const Entry = createdSchemas.entry;

mongoose.connect("mongodb+srv://admin-iggy:Testing1234@cluster0.saqoi.mongodb.net/mealplannerDB", {useNewUrlParser: true,useUnifiedTopology: true});
//mongoose.connect("mongodb://localhost:27017/mealplannerDB", {useNewUrlParser: true,useUnifiedTopology: true});

let csvContents = [];
fs.createReadStream('weekly-meal-planner-data.csv')
  .pipe(csv())
  .on('data', (row) => {
    csvContents.push(row);
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  csvContents.forEach((entry)=>{
    let rawBookInfo = entry.Information;
    let pageNumber = rawBookInfo.match(/^\d+|\d+\b|\d+(?=\w)/g);
    pageNumber = pageNumber[0];
    let rawBook = rawBookInfo.substr(0,rawBookInfo.length-pageNumber.toString().length);
    let proBook = checkEntry(rawBook);
    //Confirm that book exists in database
    Source.find({'alias':proBook},(err,sourceResults)=>{
      if(!err&&sourceResults.length===1){
        console.log(sourceResults[0]);
        //Source exists, check if recipe exists
        Recipe.find({'sourceAlias':sourceResults[0].alias,'page':pageNumber},(err,results)=>{
          if(!err){
            if(results.length===0){
              let newRecipe = new Recipe({
                source: sourceResults[0],
                sourceAlias: sourceResults[0].alias,
                page: pageNumber,
                name: entry.Meal,
                quality: entry.Quality,
                effort: checkEntry(entry.Effort),
                time: checkEntry(entry.Time)
              });
              newRecipe.save();
            }
          }else{
            console.log(err);
          }
        })
      }else{
        console.log(err);
      }
    })

  })

  // node custom_modules/load_archive.js


    //Object produced - key object keys are: Meal, Information,Quality,Effort and Time

    // const newRecipe = new Recipe({
    //   source: entry.source,
    //   sourceAlias:entry.source.alias,
    //   page: req.body.page,
    //   name: "New Recipe",
    //   quality:"N/A",
    //   effort:"N/A",
    //   time:"N/A"
    // });

  });

  function checkEntry(bookName){
    switch (bookName) {
      case "Miguel Barclay Green":
        return "MB Green";
        break;
      case "Miguel Barclay Yellow":
        return "MB Yellow";
        break;
      case "Miguel Barclay Orange":
        return "MB Orange";
        break;
      case "Miguel Barclay Vegan":
        return "MB Vegan";
        break;
      case "Miguel Barclay Free":
        return "MB Free";
        break;
      case "Miguel Barclay Pink":
        return "MB Pink";
        break;
      case "Between half an hour and an hour":
        return "30-60 mins";
        break;
      case "Less than half an hour":
        return "<30 mins";
        break;
      case "Over one hour":
        return ">60 mins";
        break;
      case "Catherine could do it":
        return "Cath friendly";
        break;
      case "Whould not do again":
        return "Not again";
        break;
      default:
        return bookName;
    }
  };
