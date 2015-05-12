var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var io = require('socket.io');
var model = require('./model');
var dbcon = require('./config');
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

    //获取账户信息
    socket.on("getInfoReq", function(data) {
        console.log(data);
        var username = data.name;
        var cookie = data.cookie;
        var lastId = data.lastId;
        if (cookie == "123") {
            socket.emit("getInfoRes", {
                name: username,
                password: "123",
                lastId: "123"
            });
        } else {
            socket.emit("getInfoRes", {});
        }
    });
    //保存用户信息
    socket.on("saveUserReq", function(data) {
        model.findOne(data, function(result) {
            console.log(result);
            if (result.status == 1) {
                if (result.items != null) {

                } else {
                    model.insert(data, function(result2) {
                    	console.log(results);
                    });
                }
            }
        })

    });
});
