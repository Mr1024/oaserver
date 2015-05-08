var fs = require("fs");
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/oa", {
    native_parser: true
});
db.bind("notice");
/*db.notice.find().toArray(function(err,items){
	console.log(items);
});*/
/*db.notice.save({"type":"公告","sender":"薛峰1","pubtime":"2014-05-02","title":"bu"},function(err,tiem){
	
});*/
fs.readFile('test.txt', {
    "encoding": "utf8"
}, function(err, data) {
    if (!err) {
        var tablereg = /(?:<tbody id="bodyIDmessageList" class="table-body">)((?:(?!<\/tbody>)[\d\D])*)/g;
        var trreg = /<td((?:(?!<\/tr>)[\d\D])*)<\/td>/g;
        //var tdreg = /(?:<td[^>]*><div[^>]*>)(.*?)(?:<\/div><\/td>[\n\r]*?<td[^>]*><div[^>]*?><span[^>]*?>)(.*?)(?:<\/span><\/div><\/td>[\n\r]*?<td[^>]*><div[^>]*>)(.*?)(?=<\/div>)(?:(?!title=")[\d\D])*title="((?:(?!">).)*)/;
        var tdreg = /(?:<td[^>]*><div[^>]*>)(.*?)(?:<\/div><\/td>[\n\r]*?<td[^>]*><div[^>]*?><span[^>]*?>)(.*?)(?:<\/span><\/div><\/td>[\n\r]*?<td[^>]*><div[^>]*>)(.*?)(?=<\/div>)(?:(?:(?![|])[\d\D])*[|])(-\d+)(?:(?:(?!title=")[\d\D])*title=")((?:(?!">).)*)/;
        var strtable = data.match(tablereg);
        var trarry = strtable[0].match(trreg);
        trarry.forEach(function(v, i) {
            var e = tdreg.exec(v);
            if (e) {

                db.notice.save({
                    "type": e[1],
                    "sender": e[2],
                    "pubtime": e[3],
                    "title": e[5],
                    "articleId":e[4]
                }, function(err, tiem) {

                });
            }
        });

        //console.log(e[0]);
    }
});
