var proxy = require('./proxy');
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/oa", {
    native_parser: true
});
var model = require('./model');
var dbcon = require('./config');
model.openDB(dbcon);
var cookie = '';
exports.login = function login(callback) {
    var _t = this;
    db.bind('users');
    db['users'].findOne({
        random: {
            "$gt": Math.random()
        }
    }, function(err, data) {
        if (!err && data) {
            proxy.login({
                username: data.username,
                password: data.password
            }, function(err, cookie) {
                if (!err) {
                    console.log("用户"+data.username+"登陆成功，监控中");
                    if (callback) {
                        callback(cookie);
                    } else {
                        proxy.getNotice(1, 10, cookie);
                    }

                } else {
                    if (err.code == 7) {
                        console.log("人数过多，重新登录");
                        login(callback);
                    }
                    //login();
                }
            });
        } else {
            console.log("重新选择登陆用户");
            login(callback);
        }
    });
    /*model.bind('users');
    model.findOne({
        random: {
            "$gt": Math.random()
        }
    }, function(data) {
        console.log(data.items);
        if (data.items) {
            console.log(data.items.username);
            proxy.login({
                username: data.items.username,
                password: data.items.password
            }, function(err, cookie) {
                if (!err) {
                    console.log("登陆成功，监控中");
                    if (callback) {
                        callback(cookie);
                    } else {
                        proxy.getNotice(1, 10, cookie);
                    }

                } else {
                    if (err.code == 7) {
                        console.log("人数过多，重新登录");
                        login(callback);
                    }
                    //login();
                }
            });
        } else {
            console.log("筛选登陆用户");
            login(callback);
        }
    });*/
};
exports.wait = function() {
    console.log("请求完成等待下一轮");
    var _t = this;
    setTimeout(_t.login, 30000);
};
