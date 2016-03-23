/* app.js */

var fs = require("fs");

var winston = require("winston");
winston.exitOnError = false;
winston.remove(winston.transports.Console);
var WinstonDailyRotateFile = require("winston-daily-rotate-file");

//
// Indispensable.
//
function executeSequence(sequence, done) {
  (function go() {
    while (sequence.length) {
      var f = sequence.shift();
      if (f) {
        f(go);
        return;
      }
    }
    done && done();
  })();
}

//
// Mongo connector.
//
function seedDatabase(app) {

  var seed = {
    open: function(callback) {
      if (seed.database) {
        callback(seed.database);
      }
      else {
        var database = require("./database"); 
        database.open(app.config.database.mongo, function(err) {
          if (err) {
            app.abort("database error", err);
          }
          seed.database = database;
          callback(database);
        });
      }
    },
    close: function(callback) {
      if (seed.database) {
        database.close(callback);
      }
      else {
        callback();
      }
    }
  };
  return seed;
}

//
// Redis queue connector.
//
function seedWorkQueue(app, which) {

  function openWorkQueue(service) {
    var kue = require("kue");
    winston.info("Initializing", which);
    var conf = app.config[which];
    var queue = kue.createQueue(conf);

    // Handle error by shutting down.
    queue.on("error", function(error) {
      app.abort("queue error", error);
    });

    function removeJobs(err, ids) {
      if (err) {
        winston.warn("error clearing queue", err);
      }
      if (ids) {
        ids.forEach(function(id) {
          kue.Job.get(id, function(err, job) {
            if (job) job.remove();
          });
        });
      }
    }

    function requeueJobs(err, ids) {
      if (err) {
        winston.warn("error restarting queue", err);
      }
      if (ids) {
        ids.forEach(function(id) {
          kue.Job.get(id, function(err, job) {
            job.inactive();
          });
        });
      }
    }

    service.queue = queue;
    service.wrapper = {
      enqueue: function(data, callback) {
        winston.info("enqueue", data);
        queue.create("job", data).removeOnComplete(true).save(callback);
      },
      process: function(worker) {
        var concurrency = conf.concurrency || 1;
        queue.process("job", concurrency, worker);
      },
      clear: function(callback) {
        queue.active(function(err, ids) {
          removeJobs(err, ids);
          queue.inactive(function(err, ids) {
            removeJobs(err, ids);
            callback && callback();
          });
        });
      },
      restartJobs: function(callback) {
        queue.active(function(err, ids) {
          requeueJobs(err, ids);
          callback && callback();
        });
      },
      ifEmpty: function(callback) {
        queue.inactiveCount(function(err, inactiveCount) {
          if (!err && inactiveCount == 0) {
            queue.activeCount(function(err, activeCount) {
              if (!err && activeCount == 0) {
                callback();
              }
            });
          }
        });
      },
      inactiveCount: function(callback) {
        return queue.inactiveCount(callback);
      }
    };
  };

  var seed = {
    open: function(callback) {
      if (!seed.wrapper) {
        openWorkQueue(seed);
      }
      callback(seed.wrapper);
    },
    close: function(callback) {
      if (seed.queue) {
        seed.queue.shutdown(5000, callback);
      }
      else {
        callback();
      }
    }
  };
  return seed;
}

//
// ElasticSearch connector.
//
function seedElasticSearch(app) { 
  var seed = {
    open: function(callback) {
      var es = require("./es");
      if (!seed.wrapper) {
        seed.wrapper = es.openElasticSearch(app.config.elasticsearch, function(msg, err) {
          app.abort(msg, err);
        });
      }
      callback(seed.wrapper);
    },
    close: function(callback) {
      seed.wrapper = null;
      callback();
    }
  };
  return seed;
}

function jsonFromS3(bucket, key, callback) {
  var AWS = require("aws-sdk");
  var s3 = new AWS.S3();
  s3.getObject({
    Bucket: bucket,
    Key: key,
  }, function(err, data) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, JSON.parse(data.Body.toString()));
    }
  });
}

//
// System configuration connector.
//
function seedSystem(app) { 
  var cached = null;
  return {
    open: function(callback) {
      var config = app.config.system;

      function success() {
        callback(cached.obj);
      }

      if (cached && cached.time > new Date().getTime() - config.freshness) {
        return success();
      }

      function updateCache(obj) {
        cached = {
          obj: obj,
          time: new Date().getTime()
        };
        success();
      }

      var m = config.location.match(/^s3:\/\/(.*)$/);
      if (m) {
        jsonFromS3(m[1], config.fileName, function(err, obj) {
          if (err) throw err;
          updateCache(obj);
        });
      }
      else {
        fs.readFile(config.fileName, "utf8", function(err, data) {
          if (err) throw err;
          updateCache(JSON.parse(data));
        });
      }
    },
    close: function(callback) {
      callback();
    }
  };
}

//
// App services management.
//

function openServices(app, ids, callback) {
  if (typeof ids == "string") {
    app.services[ids].open(callback);
  }
  else {
    var services = [];
    (function next() {
      var ix = services.length;
      if (ix < ids.length) {
        openServices(app, ids[ix], function(service) {
          services.push(service);
          next();
        });
      }
      else {
        callback.apply(null, services);
      }
    })();
  }
}

function closeAllServices(app, done) {
  var sequence = [];
  for (var key in app.services) {
    sequence.push(function(done) { app.services[key].close(done); });
  }
  executeSequence(sequence, function(){ setTimeout(done, 1000); });
}

//
// Graceful app shutdown.
//
function exit(app, status) {
  status = status || 0;
  winston.log("exiting", { status: status }, function() {
    closeAllServices(app, function() {
      process.exit(status);
    });
  });
}

function abort(app, msg, error) {
  if (error) {
    console.error(msg);
    winston.error(msg, { error: error });
  }
  else {
    console.error(msg, error);
    winston.warn(msg);
  }
  exit(app, 1);
}

function initLog(app) {
  var logName = app.component;
  if (app.config.params.site) {
    logName += "-" + app.config.params.site;
  }
  logName += ".log";
  winston.add(WinstonDailyRotateFile, { dirname: "logs", filename: logName });
  winston.log("info", "starting");
}

//
// BaseApp constructor.
//
function BaseApp(component, args, config) {
  var self = this;
  self.component = component;
  self.args = args;
  self.params = config.params;
  self.config = config;
  self.services = {
    db: seedDatabase(self),
    crawlerQueue: seedWorkQueue(self, "crawlerQueue"),
    scraperQueue: seedWorkQueue(self, "scraperQueue"),
    elasticsearch: seedElasticSearch(self),
    system: seedSystem(self)
  };

  self.executeSequence = executeSequence;

  self.open = function(id, callback) { openServices(self, id, callback); };
  self.exit = function() { exit(self); }
  self.abort = function(msg, error) { abort(self, msg, error); }

  self.log = winston.log;
  self.debug = winston.debug;
  self.info = winston.info;
  self.warn = winston.warn;
  self.error = winston.error;

  initLog(this);
}

//
// App constructor.
//
function App(component) {
  var args = require("yargs").argv;
  var config = require("./config.js")({
    component: component,
    site: args.site,
    env: args.env
  });
  BaseApp.call(this, component, args, config);
}

//
// PipelineApp constructor.  Defaults site to en_wikipedia, and that's it.
//
function PipelineApp(component) {
  var args = require("yargs").argv;
  var config = require("./config.js")({
    component: component,
    site: args.site || "en_wikipedia",
    env: args.env
  });
  BaseApp.call(this, component, args, config);
}

module.exports = {
  App: App,
  PipelineApp: PipelineApp,
  executeSequence: executeSequence
};
