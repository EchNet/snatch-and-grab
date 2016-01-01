/* crawler.js */

var component = "crawler";
var version = "0.1.1.10";

var redis = require("redis");
var yargs = require("yargs");
var request = require("request");
var extend = require("extend");

function initCollection(app, proceed) {
  console.log("init collection...");
  var conf = app.config.database.mongo;
  var url = "mongodb://" + conf.host + ":" + conf.port + "/" + conf.database;

  mongo.MongoClient.connect(url, function(err, db) {
    if (err) {
      app.abort("database error", err);
    }
    else {
      var collection = db.collection(conf.collection);

      app.collection = {
        add: function(record, callback) {
          collection.insertOne(record, null, callback);
        },
      };

      executeSequence([
        app.args.clean ? (function(go) { collection.deleteMany({}, go); }) : null,
        app.args.clean ? (function(go) { collection.createIndex({ uri: 1 }, { unique: true }, go); }) : null
      ], proceed);
    }
  });
}

function initWorker(app, proceed) {
  console.log("init worker...");

  var host = app.config.site.host;
  var timeout = app.config.worker.timeout;
  var forEachLink = app.config.site.forEachLink;
  var forEachLeaf = app.config.site.forEachLeaf;

  function doRequest(uri, callback) {
    var url = host + uri;
    request({
      url: url,
      timeout: timeout,
      followRedirect: false
    }, callback);
  }

  function handleValidResponse(uri, text) {
    var updateTasks = [];
    forEachLink(text, function(hrefUri) {
      updateTasks.push(function(proceed) {
        app.queue.enqueue(hrefUri, proceed);
      });
    });
    forEachLeaf(text, function(hrefUri) {
      console.log("recognized", hrefUri);
      updateTasks.push(function(proceed) {
        app.collection.add({
          uri: hrefUri,
          created_at: new Date(),
          crawler_version: component + " " + version;
        }, proceed);
      });
    });
    return updateTasks;
  }

  app.worker = function(job, done) {
    var uri = job.data.uri;
    doRequest(uri, function(error, response, text) {
      if (error) {
        console.log("request error", uri, error);
      }
      else if (response.statusCode != 200) {
        console.log("bad HTTP status code", uri, response.statusCode);
      }
      else if (response.headers["content-type"] != "text/html; charset=UTF-8") {
        console.log("bad content type", uri, response.headers["content-type"]);
      }
      else {
        console.log("content received", uri);
        var updateTasks = handleValidResponse(uri, text);
        if (updateTasks.length == 0) {
          console.log("warning: apparent dead end", uri);
        }
        executeSequence(updateTasks, done);
      }
    });
  };

  proceed();
}

(function(args) {
  var app = {
    args: args,
    scrapeId: "xxxxx",
    exit: function(status) {
      status = status || 0;
      console.log("Exiting...");
      process.exit(status);
    },
    abort: function(msg, error) {
      console.log(msg, error);
      this.exit(1);
    }
  };

  executeSequence([
    function(done){ initConfig(app, done); },
    function(done){ initQueue(app, done); },
    function(done){ initCollection(app, done); },
    function(done){ initWorker(app, done); },
  ], function() {
    console.log("start app");
    app.queue.process(app.worker);
  });

})(yargs.argv);
