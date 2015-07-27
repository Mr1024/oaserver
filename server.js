var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var child = require('child_process');
var noticeevent = require('./noticeevent');
var io = require('socket.io');
var crypto = require('crypto');
var model = require('./model');
var dbcon = require('./config');
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/oa", {
    native_parser: true
});
var childnotice = child.fork('./start.js');
var users = {};
model.openDB(dbcon);
model.bind("users");
var server = http.createServer(function(req, res) {
    var reqURL = req.url;
    var reqHeader = req.headers;
    var pathname = url.parse(reqURL).pathname;
    var pathArry = pathname.split("/");
    if (pathArry[1] == 'images') {
        var id = pathArry[2];
        db.bind('file');
        db['file'].findOne({
            id: id
        }, function(err, data) {
            if (!err) {
                if (data) {
                    res.writeHead(200, {
                        'Content-Type': data.contenttype
                    });
                    res.write(data.content.buffer);
                    res.end();
                } else {
                    res.writeHead(200, {
                        'Content-Type': 'text/html'
                    });
                    res.end("hello");
                }

            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                res.end("hello");
            }
        });
    } else if (pathArry[1] == 'fileUpload') {
        var title = decodeURIComponent(pathArry[2]);
        db.bind('file');
        db['file'].findOne({
            title: title
        }, function(err, data) {
            if (!err) {
                if (data) {
                    res.writeHead(200, {
                        'Content-Type': data.contenttype,
                        'Content-disposition': "attachment;filename=" + encodeURIComponent(title)
                    });
                    res.write(data.content.buffer);
                    res.end();
                } else {
                    res.writeHead(200, {
                        'Content-Type': 'text/html'
                    });
                    res.end("hello");
                }

            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                res.end("hello");
            }
        });
    } else if (pathArry[1] == 'file') {
        var fileid = pathArry[2];
        db.bind('file');
        db['file'].findOne({
            id: fileid,
            type: "file"
        }, function(err, data) {
            if (!err) {
                if (data) {
                    res.writeHead(200, {
                        'Content-Type': 'text/html',
                    });
                    res.write(data.content);
                    res.end();
                } else {
                    res.writeHead(200, {
                        'Content-Type': 'text/html'
                    });
                    res.end("hello");
                }

            } else {
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                res.end("hello");
            }
        });
    } else {
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
    }
});
server.listen(8080);
var socket = io.listen(server);
socket.on('connection', function(socket) {
    childnotice.on("message", function(data) {
        socket.emit('unreadmsgRes', {
            type: "notify",
            data: data
        });
    });
    socket.on('latestmsgReq', function(data) {
        db.bind("notice");
        /*if (typeof data.lastmsgId != "undefined") {
            db["notice"].findOne({
                articleId: data.lastmsgId
            }, function(err, item) {
                if (err) {
                    socket.emit('latestmsgRes', new Array());
                } else {
                    //console.log(item._id);
                    db["notice"].find({
                        pubunixtime: {
                            "$gt": item.pubunixtime
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
        } else {*/
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
        });
        /*}*/
        /*db["notice"].find({}, {
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
        })*/
    });
    socket.on('unreadmsgReq', function(data) {
        if (data.username) {
            users[data.username] = {
                lastlogin: Date.now()
            };
        }
        childnotice.send({
            users: users
        });
        db.bind("notice");
        db["notice"].findOne({
            articleId: data.lastmsgId
        }, function(err, item) {
            if (err || !item) {
                socket.emit('unreadmsgRes', {
                    type: "tip",
                    data: []
                });
            } else {
                db["notice"].find({
                    pubunixtime: {
                        "$gt": item.pubunixtime
                    }
                }).sort({
                    "pubunixtime": -1
                }).limit(data.limit).toArray(function(err, items) {
                    if (err) {
                        items = [];
                    }
                    socket.emit('unreadmsgRes', {
                        type: "tip",
                        data: items
                    });
                });
            }
        });
    });
    socket.on('oldmsgReq', function(data) {
        db.bind("notice");
        db["notice"].findOne({
            articleId: data.articleId
        }, function(err, item) {
            if (err) {
                socket.emit('oldmsgRes', new Array());
            } else {
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
                    socket.emit('oldmsgRes', items);
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
        db.bind('users');
        db['users'].findOne({
            "username": username
        }, function(err, result) {
            var obj = {};
            if (!err) {
                if (result && sessionId == result.sessionId) {
                    obj.username = result.username;
                    obj.password = result.password;
                    obj.sessionId = result.sessionId;
                }
                socket.emit("getInfoRes", obj);
            }
        });
        /*model.findOne({
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
        });*/
    });
    //保存用户信息
    socket.on("saveUserReq", function(data) {
        var sessionId = createHash();
        db.bind('users');
        db['users'].findAndModify({
            "username": data.username
        }, [], {
            $set: {
                "username": data.username,
                "password": data.password,
                "userId": data.userId,
                "sessionId": sessionId,
                "random": Math.random()
            }
        }, {
            new: true,
            upsert: true
        }, function(err, result) {
            if (!err && result) {
                socket.emit('saveUserRes', {
                    username: result.username,
                    sessionId: result.sessionId
                });
            }
        });
    });


});
//定时清除users未登录账户
setInterval(function() {
    var usercache = {};
    var time = Date.now();
    for (var i in users) {
        if (time - users[i].lastlogin <= 1000 * 60 * 5) {
            usercache[i] = users[i];
        }
    }
    users = usercache;
}, 1000 * 60 * 5);

function createHash() {
    return crypto.createHash('sha1').update(Date.now() + "R" + Math.random()).digest('hex');
}
