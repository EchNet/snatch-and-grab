/* job-queue.js */

var kue = require("kue");
var fs = require("fs");
var args = require("yargs").argv;
var extend = require("extend");

var config = {
  type: "en",
  site: {
    host: "https://en.wikipedia.org",
    origin: "/wiki/Portal:Contents/A–Z_index"
  },
  worker: {
    concurrency: 1,
    path: [
      "en_wikipedia_azindex",
      "en_wikipedia_allpages",
      "en_wikipedia_article"
    ]
  },
  queue: {
    prefix: "q",
    redis: {
      host: "localhost",
      port: 6379,
      db: 1
    }
  }
};

function readConfig(configFileName) {
  return JSON.parse(fs.readFileSync(configFileName, "utf8"));
}

if (args.config) {
  console.log("using config file", args.config);
  extend(true, config, readConfig(args.config));
}
console.log("config", config);

var queue = kue.createQueue({
  prefix: config.queue.prefix,
  redis: config.queue.redis
});

function enqueue(uri) {
  queue.create(config.type, { uri: uri }).save();
}

var workerPath = [];
for (var ix = 0; ix < config.worker.path.length; ++ix) {
  workerPath.push(require("./" + config.worker.path[ix] + ".js"));
}

function work(job) {
  var uri = job.data.uri;
  console.log(uri);
  //for (var ix = 0; ix < workerPath.length; ++ix) {
    //if (module.recognize(
  //}
}

queue.process(config.type, config.worker.concurrency, function(job, done) {
  console.log(job.data);
  try {
    work(job);
    done();
  }
  catch (e) {
    done(e);
  }
});

if (args.start) {
  enqueue(config.site.origin);
}
