var model = require('./model');
var dbcon = require('./config');
var proxy = require('./proxy');
var fs = require('fs');
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/oa", {
    native_parser: true
});
model.openDB(dbcon);
exports.getNotice = function(data, lastNotice, cookie, callback) {
    model.bind('notice');
    db.bind('notice');
    var tablereg = /(?:<tbody id="bodyIDlistTable" class="table-body">)((?:(?!<\/tbody>)[\d\D])*)/g;
    var pagenumreg = /(?:第<input type="text"(?:(?!=value=")[\d\D])*value=")(\d+)(?:"(?:(?!pageCount=")[\d\D])*pageCount=")(\d+)/g;
    var trreg = /<td((?:(?!<\/tr>)[\d\D])*)<\/td>/g;
    //var tdreg = /(?:<td[^>]*><div[^>]*>)(.*?)(?:<\/div><\/td>[\n\r]*?<td[^>]*><div[^>]*?><span[^>]*?>)(.*?)(?:<\/span><\/div><\/td>[\n\r]*?<td[^>]*><div[^>]*>)(.*?)(?=<\/div>)(?:(?:(?![|])[\d\D])*[|])(-?\d+)(?:(?:(?!title=")[\d\D])*title=")((?:(?!">).)*)/;
    var tdreg = /<td[^>]*>(?:(?!id=)[\d\D])*id=(-?\d+)(?:(?!title=").)*title="([^"]+)"(?:(?!title=")[\d\D])*title="([^"]+)"(?:(?!title=")[\d\D])*title="(?:(?!title=:)[\d\D])*title="([^"]+)"(?:(?!>\d+)[\d\D])*>((?:(?!<).)*)/;
    var pageresult = pagenumreg.exec(data);
    var page = pageresult[1];
    var pagecount = pageresult[2];
    var strtable = data.match(tablereg);
    fs.writeFile("table.txt", strtable, {
        "encoding": "utf8"
    }, function() {});
    var trarry = strtable[0].match(trreg);
    var stoptag = false;
    for (var i in trarry) {
        var e = tdreg.exec(trarry[i]);
        if (e) {
            if (lastNotice && lastNotice.pubunixtime >= new Date(e[5]).getTime()) {
                stoptag = true;
                break;
            } else {
                db['notice'].findAndModify({
                    "articleId": e[1],
                    "pubunixtime": {
                        "$lte": new Date(e[5]).getTime()
                    }
                }, [], {
                    $set: {
                        "type": e[3],
                        "sender": e[4],
                        "pubtime": e[5],
                        "pubunixtime": new Date(e[5]).getTime(),
                        "title": e[2],
                        "articleId": e[1]
                    }
                }, {
                    new: true,
                    upsert: true
                }, function(err, result) {
                    if (!err) {
                        proxy.getArticle(result.articleId, cookie);
                    }
                });
            }
        }
    }

    if (stoptag) {
        callback(false);
        return
    }

    if (page == pagecount) {
        console.log("请求完毕");
        callback(false);
    } else {
        callback(true);
    }

};
exports.getlastNotice = function(callback) {
    db.bind('notice');
    db["notice"].find({}).sort({
        pubunixtime: -1
    }).limit(1).toArray(function(err, items) {
        if (err) {
            items = [];
        }
        callback(items);
    });
};
exports.saveArticle = function(data) {
    data = '<!doctype html><html lang="zh-cmn-Hans"><head>' + data;
    fs.writeFile("newarticle1.html", data, {
        "encoding": "utf8"
    }, function() {});
    var deljsReg = /<script[\d\D]*?<\/\s*script>/gi;
    var csshrefReg = /"\/seeyon\//gi;
    var annexReg = /theToShowAttachments.add\(new Attachment\((.*?)(?=\)\))/gi;
    var replaceannexReg = /<tr id="attachmentTr"[\d\D]*?<\/table>[\d\D]*?<\/td>[\d\D]*?<\/tr>/g;
    var imgreg = /<img.*?src="(.*?fileUpload.do.*?fileId=(.+?)&(?:(?!">).)*?"\s*\/?>)/gi;
    var deloneventReg = /<body.*?(?=>)/gi;
    var imgArry = data.match(imgreg);
    console.log("img"+imgArry);
    if (imgArry) {
        console.log(imgreg.length)
        /*imgArry.forEach(function(item, j) {
            data = data.replace(imgreg, '$2http://172.18.24.64:8080/fileUpload?$4');
        });*/
    }
    var annex = data.match(annexReg);
    var annexobj = {};
    if (annex) {
        annex.forEach(function(v, i) {
            var subreg = /'.*/;
            var txt3 = v.match(subreg);
            if (txt3) {
                var txt4 = txt3[0].replace(/'/g, "");
                var arry = txt4.split(",");
                annexobj[arry[9]] = {
                    id: arry[9],
                    title: arry[5],
                    icon: arry[13],
                    size: arry[8],
                    createDate: arry[7].split(' ')[0]
                };
                var time = arry[7].split(' ')[0];
                /*console.log(arry[5]);
                var url = 'http://172.18.1.48/seeyon/fileUpload.do?method=download&fileId=' + arry[9] + '&createDate=' + time + '&filename=' + arry[5];
                fs.writeFile("annex.txt", url, {
                    "encoding": "utf8"
                }, function() {});*/
            }

        });
        console.log(annexobj);

    }
    var annexstr = "";
    for (var i in annexobj) {
        annexstr += '<div id="attachmentDiv_' + annexobj[i].id + '" class="attachment_block" style="float: left;height: 18px; line-height: 14px;nowrap=""><img src="http://172.18.1.48/seeyon/common/images/attachmentICON/' + annexobj[i].icon + '" border="0" height="16" width="16" align="absmiddle" style="margin-right: 3px;"><a href="172.18.2.64:8080/fileUpload?' + annexobj[i].title + '" title="' + annexobj[i].title + '" download="' + annexobj[i].title + '" style="font-size:12px;color:#007CD2;">' + annexobj[i].title + '(' + annexobj[i].size / 1024 + 'KB)</a>[<a href="172.18.2.64:8080/fileUpload?' + annexobj[i].title + '" download="' + annexobj[i].title + '" style="font-size:12px;color:#007CD2;">下载</a>]&nbsp;<input type="hidden" name="input_file_id" value="-2974606410562058622">&nbsp;&nbsp;</div>';
    }
    data = data.replace(deloneventReg, '<body');
    var txt1 = data.replace(deljsReg, '');
    var txt2 = txt1.replace(csshrefReg, '"http://172.18.1.48/seeyon/');
    if (Object.keys(annexobj).length > 0) {
        var annexCon = '<tr id="attachmentTr"><td class="paddingLR" height="30" colspan="6"><table border="0" cellspacing="0" cellpadding="0" width="100%" height="100%"><tbody><tr><td height="10" valign="top" colspan="6"><hr size="1" class="newsBorder"></td></tr><tr style="padding-bottom: 20px;"><td nowrap="nowrap" width="50" class="font-12px" valign="top"><b>附件:&nbsp;</b></td><td width="100%" class="font-12px">' + annexstr + '</td></tr></tbody></table></td></tr>';
        txt2 = txt2.replace(replaceannexReg, annexCon);
    }
    fs.writeFile("newarticle.html", txt2, {
        "encoding": "utf8"
    }, function() {});
};
exports.checkNotice = function(data) {
    model.bind('notice');
    var tablereg = /(?:<tbody id="bodyIDmessageList" class="table-body">)((?:(?!<\/tbody>)[\d\D])*)/g;
    var trreg = /<td((?:(?!<\/tr>)[\d\D])*)<\/td>/g;
    var tdreg = /(?:<td[^>]*><div[^>]*>)(.*?)(?:<\/div><\/td>[\n\r]*?<td[^>]*><div[^>]*?><span[^>]*?>)(.*?)(?:<\/span><\/div><\/td>[\n\r]*?<td[^>]*><div[^>]*>)(.*?)(?=<\/div>)(?:(?:(?![|])[\d\D])*[|])(-?\d+)(?:(?:(?!title=")[\d\D])*title=")((?:(?!">).)*)/;
    var strtable = data.match(tablereg);
    var trarry = strtable[0].match(trreg);
    trarry.forEach(function(v, i) {
        var e = tdreg.exec(v);
        if (e) {
            /*model.insert({
                "type": e[1],
                "sender": e[2],
                "pubtime": e[3],
                "pubunixtime": new Date(e[3]).getTime(),
                "title": e[5],
                "articleId": e[4]
            }, function(err, item) {
                if (!err) {
                    proxy.getArticle(e[4])
                } else {
                    console.log(err);
                }
            });*/
            model.update({
                    "articleId": e[4],
                    "pubunixtime": {
                        "$lte": new Date(e[3]).getTime()
                    }
                }, {
                    "type": e[1],
                    "sender": e[2],
                    "pubtime": e[3],
                    "pubunixtime": new Date(e[3]).getTime(),
                    "title": e[5],
                    "articleId": e[4]
                },
                function(item) {
                    if (item.status == 1) {
                        proxy.getArticle(e[4])
                    } else {
                        //console.log(item);
                    }
                });
        }
    });
};
