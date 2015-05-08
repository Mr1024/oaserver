var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var io = require('socket.io');
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
    	socket.send('message:'+data);
        console.log("收到"+data);
    });
});
