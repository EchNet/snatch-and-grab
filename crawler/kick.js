/* kick.js */

var redis = require("redis");
var kue = require("kue");
var yargs = require("yargs");
var request = require("request");
var extend = require("extend");
var configs = require("./config.js");
var mongo = require("mongodb");

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

// Start crawling somewhere.
function primeApp(app, proceed) {
  console.log("prime app");
  app.queue.enqueue(app.args._[0] || app.config.site.origin, proceed);
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
    function(done){ primeApp(app, done); }
  ], function() {
    app.exit(0);
  });

})(yargs.argv);
