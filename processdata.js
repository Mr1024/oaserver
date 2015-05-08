var model = require('./model');
var dbcon = require('./config');
var proxy = require('./proxy');
model.openDB(dbcon);
exports.getNotice = function(data) {
    model.bind('notice');
    var tablereg = /(?:<tbody id="bodyIDmessageList" class="table-body">)((?:(?!<\/tbody>)[\d\D])*)/g;
    var trreg = /<td((?:(?!<\/tr>)[\d\D])*)<\/td>/g;
    var tdreg = /(?:<td[^>]*><div[^>]*>)(.*?)(?:<\/div><\/td>[\n\r]*?<td[^>]*><div[^>]*?><span[^>]*?>)(.*?)(?:<\/span><\/div><\/td>[\n\r]*?<td[^>]*><div[^>]*>)(.*?)(?=<\/div>)(?:(?:(?![|])[\d\D])*[|])(-\d+)(?:(?:(?!title=")[\d\D])*title=")((?:(?!">).)*)/;
    var strtable = data.match(tablereg);
    var trarry = strtable[0].match(trreg);
    trarry.forEach(function(v, i) {
        var e = tdreg.exec(v);
        if (e) {
            model.insert({
                "type": e[1],
                "sender": e[2],
                "pubtime": e[3],
                "title": e[5],
                "articleId": e[4]
            }, function(err, item) {
            	if(!err){
            		proxy.getArticle(e[4])
            	}else{
            		console.log(err);
            	}
            });
        }
    });
};
exports.saveArticle=function(data){
	
}
