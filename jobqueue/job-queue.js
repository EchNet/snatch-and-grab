/* job-queue.js */

var kue = require("kue");
var yargs = require("yargs");
var request = require("request");
var extend = require("extend");
var configs = require("./config.js");

var args = yargs.argv;
var config = (function() {
  var configSelector = args.config || "default";
  console.log("using", configSelector, "config");
  return configs[configSelector];
})();
console.log(config);

var queue = kue.createQueue({
  prefix: config.queue.prefix,
  redis: config.queue.redis
});

function enqueue(uri) {
  console.log("enqueue", uri);
  queue.create(config.type, { uri: uri }).save();
}

var workerPath = [];
for (var ix = 0; ix < config.worker.path.length; ++ix) {
  workerPath.push(require("./" + config.worker.path[ix] + ".js"));
}

function process(body) {
  var digest = {};
  for (var ix = 0; ix < workerPath.length; ++ix) {
    var workerModule = workerPath[ix];
    if (workerModule.recognize(body)) {
      workerModule.process(body, {
        enqueue: enqueue,
        scrape: function(content) {
          digest = extend(true, digest, content);
        }
      });
    }
  }
  return digest;
}

function work(job, done) {
  var uri = job.data.uri;
  var url = config.site.host + uri;
  console.log("Requesting", url);
  request({
    url: url,
    followRedirect: false,
    followRedirects: false,
    followAllRedirects: false
  }, function(error, response, body) {
    if (error) {
      done(error);
    }
    else if (response.statusCode != 200) {
      console.log("response code", response.statusCode);
      done();
    }
    else {
      var contentType = response.headers["content-type"];
      if (response.headers["content-type"] != "text/html; charset=UTF-8") {
        console.log("bad content type", contentType);
        console.log(response);
      }
      else {
        var digest = process(body);
        console.log(digest);
      }
      done();
    }
  });
}

queue.process(config.type, config.worker.concurrency, function(job, done) {
  console.log(job.data);
  try {
    work(job, done);
  }
  catch (e) {
    done(e);
  }
});

if (args.start) {
  enqueue(config.site.origin);
}
