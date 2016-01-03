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

  function openDatabase(service, callback) {
    var MongoClient = require("mongodb").MongoClient;
    var conf = app.config.database.mongo;
    var url = "mongodb://" + conf.host + ":" + conf.port + "/" + conf.database;
    console.log("Connecting to " + url + "...");
    MongoClient.connect(url, function(err, db) {
      if (err) {
        app.abort("database error", err);
      }
      else {
        var collection = db.collection(conf.collection);
        var controlCollection = db.collection(conf.controlCollection);
        var wrapper = {
          db: db,
          collection: collection,
          controlCollection: controlCollection
        };
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
        openDatabase(this, callback);
      }
    },
    close: function(callback) {
      if (this.db) {
        this.db.close(callback);
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

    // Clean up after completed jobs.
    queue.on("job complete", function(id) {
      kue.Job.get(id, function(err, job) {
        job && job.remove();
      });
    });

    // Handle error by shutting down.
    queue.on("error", function(error) {
      app.abort("queue error", error);
    });

    service.queue = queue;
    service.wrapper = {
      enqueue: function(uri, callback) {
        console.log("enqueue", uri);
        queue.create("job", { uri: uri }).save(callback);
      },
      process: function(worker) {
        var concurrency = conf.concurrency || 1;
        queue.process("job", concurrency, worker);
      },
      inactiveCount: function(callback) {
        queue.inactiveCount(callback);
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
      }
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
    console.log("Exiting...");
    process.exit(status);
  });
}

function abort(app, msg, error) {
  console.log(msg, error);
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
    scraperQueue: seedWorkQueue(self, "scraperQueue")
  };

  self.executeSequence = executeSequence;

  self.open = function(id, callback) { openServices(self, id, callback); };
  self.exit = function() { exit(self); }
  self.abort = function() { abort(self); }
}

module.exports = {
  App: App,
  executeSequence: executeSequence
};
