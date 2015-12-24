/* app.js */

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

  return {
    open: function(callback) {
      if (this.database) {
        callback(this.database);
      }
      else {
        var database = require("./database"); 
        database.open(app.config.database.mongo, function(err) {
          if (err) {
            app.abort("database error", err);
          }
          this.database = database;
          callback(database);
        });
      }
    },
    close: function(callback) {
      if (this.database) {
        database.close(callback);
      }
      else {
        callback();
      }
    }
  };
}

//
// Redis queue connector.
//
function seedWorkQueue(app, which) {

  function openWorkQueue(service) {
    var kue = require("kue");
    console.log("Initializing", which);
    var conf = app.config[which];
    var queue = kue.createQueue(conf);

    // Handle error by shutting down.
    queue.on("error", function(error) {
      app.abort("queue error", error);
    });

    function removeJobs(err, ids) {
      if (err) {
        console.log("error clearing queue", err);
      }
      if (ids) {
        ids.forEach(function(id) {
          kue.Job.get(id, function(err, job) {
            job.remove();
          });
        });
      }
    }

    function requeueJobs(err, ids) {
      if (err) {
        console.log("error restarting queue", err);
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
      enqueue: function(uri, callback) {
        console.log("enqueue", uri);
        queue.create("job", { uri: uri }).removeOnComplete(true).save(callback);
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

  return {
    open: function(callback) {
      if (!this.wrapper) {
        openWorkQueue(this);
      }
      callback(this.wrapper);
    },
    close: function(callback) {
      if (this.queue) {
        this.queue.shutdown(5000, callback);
      }
      else {
        callback();
      }
    }
  };
}

//
// Redis checklist connector.
//
function seedChecklist(app) { 

  function openChecklist(service, callback) {
    console.log("Initializing checklist...");
    var redis = require("redis");
    var redisConfig = app.config.checklist.redis;
    var redisClient = redis.createClient({
      host: redisConfig.host,
      port: redisConfig.port
    });
    redisClient.select(redisConfig.db, function(err) {
      if (err) {
        app.abort("redis select", err);
      }
      else {
        var wrapper = {
          check: function(uri, callback) {
            redisClient.get(uri, function(err, reply) {
              if (!reply) {
                redisClient.set(uri, "X", callback);
              }
            });
          }
        };
        service.redisClient = redisClient;
        service.wrapper = wrapper;
        callback(wrapper);
      }
    });
  }

  return {
    open: function(callback) {
      if (this.wrapper) {
        callback(this.wrapper);
      }
      else {
        openChecklist(this, callback);
      }
    },
    close: function(callback) {
      if (this.redisClient) {
        this.redisClient.quit();
        this.redisClient = null;
      }
      callback();
    }
  };
}

//
// ElasticSearch connector.
//
function seedElasticSearch(app) { 
  return {
    open: function(callback) {
      var es = require("./es");
      if (!this.wrapper) {
        this.wrapper = es.openElasticSearch(app.config.elasticsearch, function(msg, err) {
          app.abort(msg, err);
        });
      }
      callback(this.wrapper);
    },
    close: function(callback) {
      this.wrapper = null;
      callback();
    }
  };
}

//
// System configuration connector.
//
function seedSystem() { 
  return {
    open: function(callback) {
      callback({ index: "pages1" });
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
  executeSequence(sequence, done);
}

//
// Graceful app shutdown.
//
function exit(app, status) {
  closeAllServices(app, function() {
    status = status || 0;
    console.log(app.config.params.component, "exiting", "(" + status + ")");
    process.exit(status);
  });
}

function abort(app, msg, error) {
  if (error) {
    console.log(msg, error);
  }
  else {
    console.log(msg);
  }
  exit(app, 1);
}

//
// App constructor.
//
function App(component) {
  var self = this;
  var args = require("yargs").argv;
  var config = require("./config.js")({
    component: component,
    site: args.site,
    env: args.env
  });

  self.component = component;
  self.args = args;
  self.config = config;
  self.services = {
    db: seedDatabase(self),
    crawlerQueue: seedWorkQueue(self, "crawlerQueue"),
    scraperQueue: seedWorkQueue(self, "scraperQueue"),
    elasticsearch: seedElasticSearch(self),
    system: seedSystem()
  };

  self.executeSequence = executeSequence;

  self.open = function(id, callback) { openServices(self, id, callback); };
  self.exit = function() { exit(self); }
  self.abort = function(msg, error) { abort(self, msg, error); }

  console.log(component, "starting");
}

module.exports = {
  App: App,
  executeSequence: executeSequence
};
