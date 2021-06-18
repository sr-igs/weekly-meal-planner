exports.get_entries = function(entrydb,sourcedb){

  let promise = new Promise((myResolve,myReject)=>{
    let entries=[];
    entrydb.find({active:true}).populate('recipe').sort({date:1}).exec(function(err,foundEntries){
      if(!err){
        if(foundEntries.length>0){
          entries = foundEntries
        };
        sourcedb.find({}).exec(function(err,foundSources){
          if(!err){
            let sourceAlias = [];
            foundSources.forEach(function(source){
              sourceAlias.push(source.alias);
            });
            myResolve([entries,sourceAlias]);
          }else{
            console.log(err);
          }
        })
      }else{
        console.log(err);
      }
    });
  })

return promise;
}

exports.addBook = function(req,sourcedb){
  if(req.body.name!==""&&req.body.author!==""&&req.body.alias!==""){
    let newBook = new sourcedb({
      name:req.body.name,
      author:req.body.author,
      alias:req.body.alias
    })
    newBook.save();
}};

exports.fetchBooks = function(sourcedb){
  let promise = new Promise((myResolve,myReject)=>{
    sourcedb.find({"author":{$ne:"N/A"}}).sort({"author":1}).exec((err,foundSources)=>{
      console.log("Hello");
      if(!err){
         myResolve(foundSources);
      }else{
        console.log(err);
        myReject(err);
      }
    });
  });
  return promise
};

exports.getEntryInfo = (date,entrydb,meal)=>{
  let tomorrow = new Date();
  let yesterday = new Date();
  tomorrow.setDate(date.getDate()+1);
  yesterday.setDate(date.getDate()-1);

  let newPromise = new Promise((myResolve,myReject)=>{
    entrydb.find({
      date:{"$gt":yesterday,"$lt":tomorrow},
      "meal":meal
    }).populate('recipe').exec((err,results)=>{
      if(!err){
        if(results.length>0){
          myResolve(results[0]);
        }else{
          myResolve({date:date})
        }
      }else{
        console.log(err);
        myReject()
      }
    })
  });
  return newPromise;
}
