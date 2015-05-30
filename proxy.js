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
                console.log(resheader.loginerror);
                if (resheader.loginerror == 1) {
                    callback({
                        code: 1,
                        msg: "用户不存在"
                    });
                } else if (resheader.loginerror == 2) {
                    callback({
                        code: 2,
                        msg: "密码错误"
                    })
                } else if (resheader.loginerror == 7) {
                    callback({
                        code: 7,
                        msg: "人数过多"
                    })
                }
            }
        });
    });
    formRequst.write(formDate);
    formRequst.end();
};
exports.getNotice = function(page, limit, cookie) {
    var _t = this;
    var msgoptions = {
        host: "172.18.1.48",
        port: "80",
        method: "GET",
        //path: '/seeyon/main.do?showType=0&method=showMessages&_spage=&page=' + page + '&pageSize=' + limit,
        path: '/seeyon/bulData.do?spaceType=1&method=bulMore&homeFlag=true&fragmentId=6026562696704573593&spaceId=&where=space&_spage=&&page=' + page + '&count=458&pageSize=' + limit,
        headers: {
            "Pragma": "no - cache",
            "Cache - Control": "no - cache",
            "Accept": "text / html, application / xhtml + xml, application / xml;q = 0.9, image / webp, */*;q=0.8",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36",
            "Accept-Encoding": "gzip, deflate, sdch",
            "Accept-Language": "zh-CN,zh;q=0.8",
            "Connection": "keep-alive",
            //"Referer": "http://172.18.1.48/seeyon/main.do?method=left&fromPortal=false",
            "Referer": "http://172.18.1.48/seeyon/bulData.do?method=bulMore&from=top&orgType=account&spaceType=1&fragmentId=6026562696704573593&ordinal=0",
            "Cookie": cookie
        }
    };
    process.stdout.write("第" + page + "次请求数据>>>>>>>>>>>>");
    var msgReq = http.get(msgoptions, function(res) {
        process.stdout.write("接收到第" + page + "次响应\n");
        var chunks = [],
            size = 0;
        res.on('data', function(chunk) {
            chunks.push(chunk);
            size += chunk.length;
        });
        res.on('end', function() {
            var data = Buffer.concat(chunks, size);
            var md5str = crypto.createHash('md5').update(data).digest('base64');
            if (cacheMD5 != md5str) {
                cacheMD5 = md5str;
            } else {
                noticeevent.wait();
                return
            }
            zlib.unzip(data, function(err, buffer) {
                if (!err) {
                    var html = buffer.toString();
                    /*fs.writeFile("test.txt", html, {
                        "encoding": "utf8"
                    }, function() {});*/
                    if (page == 1) {
                        processData.getlastNotice(function(item) {
                            if (item[0]) {
                                lastNotice = item[0];
                            }
                            processData.getNotice(html, lastNotice, cookie, function(tag) {
                                if (tag) {
                                    setTimeout(function() {
                                        _t.getNotice(++page, limit, cookie);
                                    }, 10000);

                                } else {
                                    noticeevent.wait();
                                }
                            });
                        });
                    } else {
                        processData.getNotice(html, lastNotice, cookie, function(tag) {
                            if (tag) {
                                setTimeout(function() {
                                    _t.getNotice(++page, limit, cookie);
                                }, 10000);
                            } else {
                                noticeevent.wait();
                            }
                        });
                    }
                } else {
                    noticeevent.login(function(cookie) {
                        _t.getNotice(page, limit, cookie);
                    });
                }
            });
        })
    }).on('error', function(e) {
        console.log("错误：" + e.message);
    });

};

exports.checkNotice = function(cookie) {
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
exports.getArticle = function(id, cookie) {
    var _t = this;
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
                    fs.writeFile("article.txt", html, {
                        "encoding": "utf8"
                    }, function() {});
                    processData.saveArticle(html, id, cookie);
                } else {
                    noticeevent.login(function(newcookie) {
                        cookie = newcookie;
                        _t.getArticle(id, cookie);
                    });
                }
            });
        })
    });
};
exports.getFile = function(obj, cookie) {
    obj.url = obj.url.replace(/amp;/g, "");
    /*if(obj.type=="annex"){
        var jsessionid=cookie.split(";")[0];
        var sessionid = jsessionid.split("=");
        obj.url=obj.url.replace(/\?/, ";jsessionid="+sessionid[1]+"?");
        obj.url=obj.url+"&";
    }*/
    var _t = this;
    var msgoptions = {
        host: "172.18.1.48",
        port: "80",
        method: "GET",
        path: obj.url,
        headers: {
            "Pragma": "no - cache",
            "Cache - Control": "no - cache",
            "Accept": "text / html, application / xhtml + xml, application / xml;q = 0.9, image / webp, */*;q=0.8",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36",
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
            obj.contenttype = headers["content-type"];
            obj.content = data;
            processData.saveFile(obj, cookie);
            if (obj.type == "image") {
                /* obj.contenttype = headers["content-type"];
                 obj.content = data;
                 processData.saveFile(obj, cookie);*/
            } else {
                /*zlib.unzip(data, function(err, buffer) {
                    if (!err) {
                        var html = buffer.toString();
                        obj.contenttype = headers["content-type"];
                        obj.content = html;
                        fs.writeFile("file.txt", html, {
                            "encoding": "utf8"
                        }, function() {});
                        processData.saveFile(obj, cookie);
                    } else {
                        noticeevent.login(function(newcookie) {
                            cookie = newcookie;
                            _t.getFile(obj, cookie);
                        });
                    }
                });*/
            }

        })
    });
};
