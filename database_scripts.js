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
