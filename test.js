var model = require('./model');
var dbcon = require('./config');
model.openDB(dbcon);
/*model.bind('notice');
model.find({sender: '苏海萍'},function(data){
	console.log(data.items);
});*/
var proxy = require('./proxy');
(function login() {
    model.bind('users');
    model.findOne({
        random: {
            "$gt": Math.random()
        }
    }, function(data) {
        if (data.items) {
        	console.log(data.items);
        	/*data.items={
        		username:"lifang",
        		password:"lifang"
        	}*/
            proxy.login({
                 username: data.items.username,
                 password: data.items.password
             }, function(err, cookie) {
                 if (!err) {
                 	proxy.getNotice(cookie);
                 } else {
                 	console.log("t");
                     //login();
                 }
             });
        } else {
            login();
        }
    });
})();
