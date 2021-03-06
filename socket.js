var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var io = require('socket.io');
var crypto = require('crypto');
var model = require('./model');
var dbcon = require('./config');
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/oa", {
    native_parser: true
});
model.openDB(dbcon);
model.bind("users");
var server = http.createServer(function(req, res) {
    var reqURL = req.url;
    var reqHeader = req.headers;
    var pathname = url.parse(reqURL).pathname;
    var filePath = path.join(process.cwd(), path.normalize(pathname.replace(/\.\./g, '')));
    var ext = path.extname(pathname);
    fs.stat(filePath, function(err, stat) {
        if (!err) {
            var raw = fs.createReadStream(filePath);
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            raw.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.end("hello");
        }
    });

    /*res.end('<h1>Hello Socket Lover!</h1>');*/
});
server.listen(8080);
var socket = io.listen(server);
socket.on('connection', function(socket) {
    socket.on('message', function(data) {
        socket.emit("test", "服务区视距");
        socket.send('message:' + data);
        console.log("收到" + data);
    });
    socket.on("test", function(data) {
        socket.emit("test", "服务区视距");
        console.log("收到" + data);
    });
    socket.on("serverstatus", function(data) {
        socket.emit("clientstatus", {});
        console.log("lastId" + data);
    });
    socket.on('latestmsgReq', function(data) {
        db.bind("notice");
        db["notice"].find({}, {
            _id: 0,
            type: 1,
            sender: 1,
            pubtime: 1,
            title: 1,
            articleId: 1
        }).sort({
            pubunixtime: -1
        }).limit(data.limit).toArray(function(err, items) {
            if (err) {
                items = [];
            }
            socket.emit('latestmsgRes', items);
        })
    });
    socket.on('oldmsgReq', function(data) {
        db.bind("notice");
        db["notice"].findOne({
            articleId: data.articleId
        }, function(err, item) {
            if (err) {
                socket.emit('latestmsgRes', new Array());
            } else {
                //console.log(item._id);
                db["notice"].find({
                    pubunixtime: {
                        "$lt": item.pubunixtime
                    }
                }).sort({
                    "pubunixtime": -1
                }).limit(data.limit).toArray(function(err, items) {
                    if (err) {
                        items = [];
                    }
                    socket.emit('latestmsgRes', items);
                });
            }
        });
    });
    //获取账户信息
    socket.on("getInfoReq", function(data) {
        console.log(data);
        var username = data.username;
        var sessionId = data.sessionId;
        var lastId = data.lastId;
        model.findOne({
            "username": username
        }, function(result) {
            var obj = {};
            if (result.status == 1 && result.items != null) {
                var item = result.items;
                if (sessionId == item.sessionId) {
                    obj.username = item.username;
                    obj.password = item.password;
                    obj.sessionId = item.sessionId;
                }
            }
            socket.emit("getInfoRes", obj);
        });
        /*if (cookie == "123") {
            socket.emit("getInfoRes", {
                name: username,
                password: "123",
                lastId: "123"
            });
        } else {
            socket.emit("getInfoRes", {});
        }*/
    });
    //保存用户信息
    socket.on("saveUserReq", function(data) {
        var sessionId = createHash();
        var obj = {
            "username": data.username,
            "password": data.password,
            "sessionId": sessionId,
            "random": Math.random()
        };
        model.update({
                "username": data.username
            }, obj,
            function(result2) {
                socket.emit("saveUserRes", {
                    "username": data.username,
                    "sessionId": sessionId
                });
            });
    });
});

function createHash() {
    return crypto.createHash('sha1').update(Date.now() + "R" + Math.random()).digest('hex');
}
