var mongo = require('mongoskin');
var db;
var dbcollection;
exports.openDB = function(dbcon) {
    db = mongo.db('mongodb://' + dbcon.username + (dbcon.username ? ':' : '') + dbcon.password + (dbcon.password ? '@' : '') + dbcon.host + ':' + dbcon.port + '/' + dbcon.dbname, {
        native_parser: true
    });
};
exports.bind = function(collection) {
    if (db) {
        dbcollection = collection;
        db.bind(collection);
    }

};
exports.insert = function(value, callback) {
    if (db) {
        if (dbcollection) {
            db[dbcollection].save(value, function(err, item) {
                console.log(err);
                if (err) {
                    return callback({
                        status: 0,
                        message: 'fail'
                    });
                }
                return callback(null, item);
            });
        }
    }
};
exports.find = function(query, options, callback) {
    if (typeof options == "function") {
        callback = options;
        options = {};
    }
    if (db) {
        if (dbcollection) {
            if (typeof query == 'function') {
                callback = query;
                query = {};
            }
            db[dbcollection].find(query, options).toArray(function(err, items) {
                if (err) {
                    return callback({
                        status: 0,
                        message: 'fail'
                    });
                }
                var obj = {
                    status: 1,
                    message: 'ok',
                    items: items
                };
                return callback(obj);
            });
        }
    }
};
exports.findOne = function(query, callback) {
    if (db) {
        if (dbcollection) {
            if (typeof query == 'function') {
                callback = query;
                query = {};
            }
            db[dbcollection].findOne(query, function(err, item) {
                if (err) {
                    return callback({
                        status: 0,
                        message: 'fail'
                    });
                }
                var obj = {
                    status: 1,
                    message: 'ok',
                    items: item
                };
                return callback(obj);
            });
        }
    }
};
exports.update = function(query, value, callback) {
    if (db) {
        if (dbcollection) {
            var set = {
                $set: value
            };
            db[dbcollection].update(query, set, {
                upsert: true
            }, function(err) {
                if (err) {
                    return callback({
                        status: 0,
                        message: 'fail'
                    });
                } else {
                    return callback({
                        status: 1,
                        message: 'ok'
                    });
                }
            });
        }
    }
};
exports.remove = function(query, callback) {
    if (db) {
        if (dbcollection) {
            db[dbcollection].remove(query, function(err) {
                if (err) {
                    return callback({
                        status: 0,
                        message: 'fail'
                    });
                }
                return callback({
                    status: 1,
                    message: 'ok'
                });
            });
        }
    }
};
