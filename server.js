var http = require("http");
var querystring = require("querystring");
var fs = require("fs");
var iconv = require('iconv-lite');
var zlib = require('zlib');
var BufferHelper = require('bufferhelper');
var cookie = "JSESSIONID=7646F2A2A84EF72708D2FBE5C1DE3BD5;login.locale=zh_CN";
var formDate = querystring.stringify({
    "UserAgentFrom": "pc",
    "login.timezone": "",
    "login.username": "zhangyizhong",
    "login.password": "zhangyizhong",
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
        "Accept - Language": "zh-CN,zh;q=0.8"
    }
};
var formRequst = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
        console.log('Response: ' + chunk);
    });
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
            console.log(cookie);
            getMsg(cookie);
        }
    });
});
formRequst.write(formDate);
formRequst.end();
/*getMsg(cookie);*/

function getMsg(cookie) {
    var msgoptions = {
        host: "172.18.1.48",
        port: "80",
        method: "GET",
        path: "/seeyon/main.do?showType=0&method=showMessages&_spage=&page=1&count=50&pageSize=20",
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
        var buffer = new BufferHelper();
        res.on('data', function(chunk) {
            chunks.push(chunk);
            console.log(chunk.length);
            size += chunk.length;
        });
        res.on('end', function() {
            var data = Buffer.concat(chunks, size);
            zlib.unzip(data, function(err, buffer) {
                if (!err) {
                    var html = buffer.toString();
                    fs.writeFile("test.txt",buffer,{"encoding":"utf8"},function(){});
                    console.log(html);
                }
            });
        })
    });
}
