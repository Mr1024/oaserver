var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/oa", {native_parser:true});
db.bind("notice");
/*db.notice.find().toArray(function(err,items){
	console.log(items);
});*/
db.notice.save({"type":"公告","sender":"薛峰1","pubtime":"2014-05-02","title":"bu"},function(err,tiem){
	
});