/* database.js */

var MongoClient = require("mongodb").MongoClient;

function openDatabase(wrapper, conf, callback) {
  var url = "mongodb://";
  if (conf.user) {
    url += conf.user + ":" + conf.password + "@";
  }
  url += conf.host + ":" + conf.port + "/" + conf.database;
  console.log("Connecting to " + url + "...");
  MongoClient.connect(url, function(err, db) {
    if (err) {
      callback(err, wrapper);
    }
    else {
      wrapper.db = db;
      wrapper.collection = db.collection(conf.collection);
      callback(null, wrapper);
    }
  });
}

function closeDatabase(wrapper, callback) {
  if (wrapper.db) {
    wrapper.db.close(callback);
  }
}

module.exports = {
  open: function(conf, callback) {
    openDatabase(this, conf, callback);
  },
  close: function(callback) {
    closeDatabase(this, callback);
  }
};
