var proxy = require('./proxy');
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/oa", {
  native_parser: true
});
var model = require('./model');
var dbcon = require('./config');
model.openDB(dbcon);
var cookie = '';
var users = {},
  onlineUser = [];
process.on('message', function(data) {
  users = data.users;
});
exports.login = function login(callback) {
  var _t = this;
  db.bind('users');
  db['users'].findOne({
    random: {
      "$lt": Math.random()
    },
    status: {
      "$ne": 0
    }
  }, function(err, data) {
    if (!err && data && !users.hasOwnProperty(data.username) && onlineUser.indexOf(data.username) < 0) {
      proxy.login({
        username: data.username,
        password: data.password
      }, function(err, cookie) {
        if (!err) {
          console.log("用户" + data.username + "登陆成功，监控中");
          if (callback) {
            callback(cookie);
          } else {
            proxy.getOnlineUser(cookie, function(onlineArry) {
              onlineUser = onlineArry;
            });
            proxy.getNotice(1, 100, cookie);
          }

        } else {
          if (err.code == 7) {
            console.log("人数过多，重新登录");
            login(callback);
          } else if (err.code == 2 || err.code == 1) {
            db['users'].remove({userId:data.userId},function(err){
              console.log(data.username+"账户有问题，已删除");
              login(callback);
            });
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
exports.wait = function(cookie) {
  var _t = this;
  proxy.logout(cookie, function() {
    console.log("请求完成等待下一轮");
    setTimeout(_t.login, 30000);
  });
};
