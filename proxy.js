var http = require("http");
var querystring = require("querystring");
var fs = require("fs");
var zlib = require('zlib');
var crypto = require('crypto');
var processData = require('./processdata');
var cookie;
exports.login = function(user, callback) {
    var formDate = querystring.stringify({
        "UserAgentFrom": "pc",
        "login.timezone": "",
        "login.username": user.username,
        "login.password": user.password,
        "authorization": "",
        "dogSessionId": ""
    });
    var options = {
        host: "172.18.1.48",
        port: "80",
        method: "POST",
        path: "/seeyon/login/proxy",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": formDate.length,
            "Pragma": "no - cache",
            "Cache - Control": "no - cache",
            "Accept": "text / html, application / xhtml + xml, application / xml;q = 0.9, image / webp, */*;q=0.8",
            "User - Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36",
            "Accept - Encoding": "gzip, deflate, sdch",
            "Origin": "http://172.18.1.48",
            "Referer": "http://172.18.1.48/seeyon/index.jsp",
            "Accept - Language": "zh-CN,zh;q=0.8"
        }
    };
    var formRequst = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {});
        res.on("end", function() {
            var resheader = res.headers;
            var cookieArry = [];
            if (resheader.loginok == 'ok') {
                resheader['set-cookie'].forEach(function(value) {
                    var reg = /^([^;]*)/g;
                    if (reg.test(value)) {
                        cookieArry.push(RegExp.$1);
                    }
                });
                cookie = cookieArry.join(";");
                callback(null, cookie);
            } else {
                if (resheader.loginerror == 1) {
                    callback({
                        code: 1,
                        msg: "用户不存在"
                    });
                } else {
                    callback({
                        code: 2,
                        msg: "密码错误"
                    })
                }
            }
        });
    });
    formRequst.write(formDate);
    formRequst.end();
};
exports.getNotice = function(cookie) {
    var msgoptions = {
        host: "172.18.1.48",
        port: "80",
        method: "GET",
        path: "/seeyon/main.do?showType=0&method=showMessages&_spage=&page=1&count=50&pageSize=100",
        headers: {
            "Pragma": "no - cache",
            "Cache - Control": "no - cache",
            "Accept": "text / html, application / xhtml + xml, application / xml;q = 0.9, image / webp, */*;q=0.8",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36",
            "Accept-Encoding": "gzip, deflate, sdch",
            "Accept-Language": "zh-CN,zh;q=0.8",
            "Referer": "http://172.18.1.48/seeyon/main.do?method=left&fromPortal=false",
            "Cookie": cookie
        }
    };
    var msgReq = http.get(msgoptions, function(res) {
        var chunks = [],
            size = 0;
        res.on('data', function(chunk) {
            chunks.push(chunk);
            size += chunk.length;
        });
        res.on('end', function() {
            var data = Buffer.concat(chunks, size);
            var md5str = crypto.createHash('md5').update(data).digest('base64');
            console.log(md5str);
            zlib.unzip(data, function(err, buffer) {
                if (!err) {
                    var html = buffer.toString();
                    fs.writeFile("test.txt", html, {
                        "encoding": "utf8"
                    }, function() {});
                    processData.getNotice(html);
                }
            });
        })
    });
};
exports.getArticle = function(id) {
    var msgoptions = {
        host: "172.18.1.48",
        port: "80",
        method: "GET",
        path: "/seeyon/bulData.do?method=userView&spaceId=&id=" + id,
        headers: {
            "Pragma": "no - cache",
            "Cache - Control": "no - cache",
            "Accept": "text / html, application / xhtml + xml, application / xml;q = 0.9, image / webp, */*;q=0.8",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36",
            "Accept-Encoding": "gzip, deflate, sdch",
            "Accept-Language": "zh-CN,zh;q=0.8",
            "Referer": "http://172.18.1.48/seeyon/main.do?method=left&fromPortal=false",
            "Cookie": cookie
        }
    };
    var msgReq = http.get(msgoptions, function(res) {
        var chunks = [],
            size = 0;
        res.on('data', function(chunk) {
            chunks.push(chunk);
            size += chunk.length;
        });
        res.on('end', function() {
            var data = Buffer.concat(chunks, size);
            zlib.unzip(data, function(err, buffer) {
                if (!err) {
                    var html = buffer.toString();
                    processData.saveArticle(html);
                }
            });
        })
    });
}
