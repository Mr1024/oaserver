var proxy = require('./proxy');
var http = require("http");
var querystring = require("querystring");
var fs = require("fs");
var zlib = require('zlib');
var crypto = require('crypto');
var processData = require('./processdata');
var noticeevent = require('./noticeevent');
var cookie;
var lastNotice = null;
var cacheMD5 = "";
var config = {
    id: '8967127865702368473',
    title: '图片1.png',
    icon: 'default.gif',
    size: '724021',
    createDate: '2015-05-07',
    type: 'annex',
    url: encodeURI('/seeyon/fileUpload.do?method=showRTE&fileId=5143183383117121728&createDate=2015-05-20&type=image')
};
var config2 = {
    id: '-6686375007531938420',
    title: '关于新华网踢毽子比赛的通知.doc',
    icon: 'doc.gif',
    size: '23040',
    createDate: '2015-05-08',
    type: 'annex',
    url: '/seeyon/fileUpload.do?method=download&fileId=-6686375007531938420&createDate=2015-05-08&filename=关于新华网踢毽子比赛的通知.doc'
};
//proxy.getFile(config,'JSESSIONID=AEEB644F5D6BDE0F9F8E1F0C030D1C6F;login.locale=zh_CN');
var cookie = 'JSESSIONID=EC6A2E5A49CFFD9934319F5F9DB055CF; login.locale=zh_CN';
var url = '/seeyon/fileUpload.do;jsessionid=EC6A2E5A49CFFD9934319F5F9DB055CF?method=doDownload&fileId=3247653361263134860&filename=%B9%D8%D3%DA%BC%D3%C7%BF%C8%AB%CD%F8%D7%CA%D6%CA%D6%A4%D5%D5%B9%DC%C0%ED%B5%C4%CD%A8%D6%AA.doc&createDate=2015-05-20&';
var msgoptions = {
    host: "172.18.1.48",
    port: "80",
    method: "GET",
    path: url,
    headers: {
        "Pragma": "no - cache",
        "Cache - Control": "no - cache",
        "Accept": "text / html, application / xhtml + xml, application / xml;q = 0.9, image / webp, */*;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36",
        "Accept-Encoding": "gzip, deflate, sdch",
        "Accept-Language": "zh-CN,zh;q=0.8",
        "Connection": "keep-alive",
        "Cookie": cookie
    }
};
var msgReq = http.get(msgoptions, function(res) {
    var chunks = [],
        size = 0,
        headers = res.headers;
    res.on('data', function(chunk) {
        chunks.push(chunk);
        size += chunk.length;
    });
    res.on('end', function() {
        var data = Buffer.concat(chunks, size);
        var html = data.toString();
        console.log(headers);
        fs.writeFile("file.txt", html, {
            "encoding": "utf8"
        }, function() {});

    })
});
