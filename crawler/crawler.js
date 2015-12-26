/* crawler.js */

var crawlerVersion = "crawler 0.1.1.10";

var redis = require("redis");
var kue = require("kue");
var yargs = require("yargs");
var request = require("request");
var extend = require("extend");
var configs = require("./config.js");
var mongo = require("mongodb");
var xmldom = require("xmldom");

function initConfig(app, proceed) {
  console.log("init config...");
  var args = app.args;
  var configSelector = args.config || "default";
  console.log("using", configSelector, "config");
  var config = configs[configSelector];
  console.log(config);
  app.config = config;
  proceed(app);
}

function initQueue(app, proceed) {
  console.log("init queue...");
  var config = app.config;
  var queue = kue.createQueue(config.queue);
  var queueType = config.type;
  var concurrency = config.worker.concurrency;

  queue.on("job complete", function(id) {
    kue.Job.get(id, function(err, job) {
      job.remove();
    });
  });

  queue.on("error", function(error) {
    app.abort("queue error", error);
  });

  app.queue = {
    enqueue: function(uri) {
      console.log("enqueue", uri);
      queue.create(queueType, { uri: uri }).save();
    },
    process: function(worker) {
      queue.process(queueType, concurrency, worker);
    }
  };

  proceed(app);
}

function initChecklist(app, proceed) {
  console.log("init checklist...");
  var prefix = app.scrapeId;
  var redisConfig = app.config.checklist.redis;
  var redisClient = redis.createClient({
    host: redisConfig.host,
    port: redisConfig.port
  });
  redisClient.select(redisConfig.db, function(err) {
    if (err) {
      app.abort("redis select", err);
    }
    app.checklist = {
      check: function(uri, callback) {
        redisClient.get(uri, function(err, reply) {
          if (!reply) {
            redisClient.set(uri, app.scraperId, callback);
          }
        });
      }
    };
    proceed(app);
  });
}

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
        wipe: function(callback) {
          collection.deleteMany().done(callback);
        },
        add: function(record, callback) {
          collection.insertOne(record, null, callback);
        },
      };

      proceed(app);
    }
  });
}

function initWorker(app, proceed) {
  console.log("init worker...");

  var DOMParser = xmldom.DOMParser;
  var domParser = new DOMParser({
    errorHandler: { warning: function(){}, error: function(){}, fatalError: function(){} }
  });

  function forEachDescendant(dom, nodeName, callback) {
    if (dom.nodeName == nodeName) {
      callback(dom);
    }
    else {
      for (var child = dom.firstChild; child != null; child = child.nextSibling) {
        if (child.nodeType == 1) {
          forEachDescendant(child, nodeName, callback);
        }
      }
    }
  }

  app.worker = function(job, done) {
    var uri = job.data.uri;
    var host = app.config.site.host;
    var timeout = app.config.worker.timeout;
    var followLink = app.config.site.followLink;
    var cleanUri = app.config.site.cleanUri;
    var recognize = app.config.site.recognize;
    app.checklist.check(uri, function() {
      var url = host + uri;
      console.log("Requesting", url);
      request({
        url: url,
        timeout: timeout,
        followRedirect: false
      }, function(error, response, text) {
        if (error) {
          console.log("network error", url, error);
        }
        else if (response.statusCode == 200 &&
                response.headers["content-type"] == "text/html; charset=UTF-8") {
          var dom = domParser.parseFromString(text);
          if (dom) {
            forEachDescendant(dom.documentElement, "a", function(ele) {
              if (followLink(ele)) {
                app.queue.enqueue(cleanUri(ele.getAttribute("href")));
              }
            });
            if (recognize(dom)) {
              var record = {};
              app.collection.add({
                uri: uri,
                crawlerVersion: crawlerVersion
              }, done);
              return;
            }
          }
        }
        done();
      });
    });
  };

  proceed(app);
}

function startApp(app) {
  console.log("start app");

  function process() {
    app.queue.process(app.worker);
  }

  // Start somewhere.
  app.queue.enqueue(app.args.start || app.config.site.origin);

  // Optionally wipe out the former collection.
  if (app.args.clean) {
    app.collection.wipe(process);
  }
  else {
    process();
  }
}

(function(args) {
  var app = {
    args: args,
    scrapeId: "xxxxx",
    abort: function(msg, error) {
      console.log(msg, error);
      process.exit(1);
    }
  };

  var appSequence = [
    initConfig,
    initQueue,
    initChecklist,
    initCollection,
    initWorker,
    startApp
  ];

  (function go() {
    (appSequence.shift())(app, go);
  })();
})(yargs.argv);
