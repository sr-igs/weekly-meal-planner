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
  tomorrow.setDate(date.getDate());
  tomorrow.setUTCHours(23,59,59,0);
  yesterday.setDate(date.getDate());
  yesterday.setUTCHours(0,0,0,0);
  console.log(tomorrow.toUTCString());
  console.log(yesterday.toUTCString());

  let newPromise = new Promise((myResolve,myReject)=>{
    entrydb.find({
      $and: [ { date: { $gte: yesterday } }, { date: { $lt: tomorrow } } ],
      meal:meal,
      active:true
      // date:{"$gt":yesterday,"$lt":tomorrow},
      // "meal":meal,
      // "active":true
    }).populate('recipe').exec((err,results)=>{
      if(!err){
        results.forEach((result)=>{
          console.log(result.date.toUTCString());
        })
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
