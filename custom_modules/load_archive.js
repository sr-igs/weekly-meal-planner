const mongoose = require('mongoose');
const customSchemas = require(__dirname+"/custom_modules/schemas.js");

const createdSchemas = customSchemas.getSchemas();
const Source = createdSchemas.source;
const Recipe = createdSchemas.recipe;
const Entry = createdSchemas.entry;

mongoose.connect("mongodb+srv://admin-iggy:Testing1234@cluster0.saqoi.mongodb.net/mealplannerDB", {useNewUrlParser: true,useUnifiedTopology: true});

let csv = File;



const csv2json = (str, delimiter = ',') => {
  const titles = str.slice(0, str.indexOf('\n')).split(delimiter);
  const rows = str.slice(str.indexOf('\n') + 1).split('\n');
  return rows.map(row => {
    const values = row.split(delimiter);
    return titles.reduce((object, curr, i) => (object[curr] = values[i], object), {})
  });
};

let jsonCSV = csv2json(csv);


  //2) If source exists, create recipe schemas
  //2b) If source doesn't exist, add to "failed" array


})
