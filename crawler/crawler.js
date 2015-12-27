/* crawler.js */

var crawlerVersion = "crawler 0.1.1.10";

var redis = require("redis");
var kue = require("kue");
var yargs = require("yargs");
var request = require("request");
var extend = require("extend");
var configs = require("./config.js");
var mongo = require("mongodb");

function initConfig(app, proceed) {
  console.log("init config...");
  var args = app.args;
  var configSelector = args.config || "default";
  console.log("using", configSelector, "config");
  var config = configs[configSelector];
  console.log(config);
  app.config = config;
  proceed();
}

function initQueue(app, proceed) {
  console.log("init queue...");
  var queue = kue.createQueue(app.config.queue);
  var queueType = app.config.type;
  var concurrency = app.config.worker.concurrency;

  queue.on("job complete", function(id) {
    kue.Job.get(id, function(err, job) {
      job.remove();
    });
  });

  queue.on("error", function(error) {
    app.abort("queue error", error);
  });

  app.queue = {
    enqueue: function(uri, callback) {
      console.log("enqueue", uri);
      queue.create(queueType, { uri: uri }).save(callback);
    },
    process: function(worker) {
      queue.process(queueType, concurrency, worker);
    }
  };

  proceed();
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
    proceed();
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
        add: function(record, callback) {
          collection.insertOne(record, null, callback);
        },
      };

      // Optionally start fresh
      if (app.args.clean) {
          collection.deleteMany().done(proceed);
      }
      else {
        proceed();
      }
    }
  });
}

function initWorker(app, proceed) {
  console.log("init worker...");

  var host = app.config.site.host;
  var timeout = app.config.worker.timeout;
  var recognize = app.config.site.recognize;
  var forEachLink = app.config.site.forEachLink;

  function doRequest(uri, callback) {
    var url = host + uri;
    request({
      url: url,
      timeout: timeout,
      followRedirect: false
    }, callback);
  }

  function handleValidResponse(uri, text, updateTasks) {
    if (recognize(text)) {
      console.log("recognized", uri);
      updateTasks.push(function(proceed) {
        app.collection.add({
          uri: uri,
          created_at: new Date(),
          crawlerVersion: crawlerVersion
        }, proceed);
      });
    }
    forEachLink(text, function(hrefUri) {
      updateTasks.push(function(proceed) {
        app.queue.enqueue(hrefUri, proceed);
      });
    });
  }

  function whenTasksComplete(tasks, proceed) {
    (function go() {
      (tasks.shift() || proceed)(go);
    })();
  }

  app.worker = function(job, done) {
    var uri = job.data.uri;
    var updateTasks = [];
    app.checklist.check(uri, function() {
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
          handleValidResponse(uri, text, updateTasks);
          if (updateTasks.length == 0) {
            console.log("warning: apparent dead end", uri);
          }
        }
        whenTasksComplete(updateTasks, done);
      });
    });
  };

  proceed();
}

// Start crawling somewhere.
function primeApp(app, proceed) {
  console.log("prime app");
  app.queue.enqueue(app.args.start || app.config.site.origin, proceed);
}

function startApp(app) {
  console.log("start app");
  app.queue.process(app.worker);
}

(function(args) {
  var app = {
    args: args,
    scrapeId: "xxxxx",
    abort: function(msg, error) {
      console.log(msg, error);
      console.log("Exiting...");
      process.exit(1);
    }
  };

  var appSequence = [
    initConfig,
    initQueue,
    initChecklist,
    initCollection,
    initWorker,
    primeApp,
    startApp
  ];

  (function go() {
    (appSequence.shift())(app, go);
  })();
})(yargs.argv);
