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

var keepHeaders = { "last-modified": 1 };

function filterHeaders(headers) {
  var filtered = {};
  for (var key in headers) {
    if (keepHeaders[key]) {
      filtered[key] = headers[key];
    }
  }
  return filtered;
}

function handleResponse(response, body, record) {
  try {
    record.status = response.statusCode;
    record.headers = filterHeaders(response.headers);
    switch (response.statusCode) {
    case 200:
      var contentType = response.headers["content-type"];
      if (response.headers["content-type"] == "text/html; charset=UTF-8") {
        record.digest = process(body);
      }
      break;
    case 301:
      record.location = response.headers.location;
      break;
    }
  }
  catch (e) {
    record.error = error = e;
  }
}

function work(job, done) {
  var uri = job.data.uri;
  var url = config.site.host + uri;
  console.log("Requesting", url);
  request({
    url: url,
    timeout: 15000,
    followRedirect: false
  }, function(error, response, body) {
    var record = {
      uri: uri,
      updateTime: new Date().getTime().toString(16)
    };
    if (error) {
      record.error = error;
    }
    else {
      handleResponse(response, body, record);
    }
    // TODO: update the database.
    console.log(record);
    done(record.error);
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
