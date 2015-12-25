/* job-queue.js */

var redis = require("redis");
var kue = require("kue");
var yargs = require("yargs");
var request = require("request");
var extend = require("extend");
var configs = require("./config.js");

var scraperVersion = "scraper 0.1.1.4";

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

var database = redis.createClient({
  host: config.database.host,
  port: config.database.port
});
database.select(config.database.db, function() {});
database.on("error", function(error) {
  console.log("database error", error);
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
  var record = {};
  for (var ix = 0; ix < workerPath.length; ++ix) {
    var workerModule = workerPath[ix];
    if (workerModule.recognize(body)) {
      workerModule.process(body, {
        enqueue: enqueue,
        scrape: function(content) {
          record.workerVersion = workerModule.version;
          record.digest = extend(true, {}, record.digest, content);
        }
      });
    }
  }
  return record;
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
        extend(true, record, process(body));
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

function makeRequest(uri, callback) {
  var url = config.site.host + uri;
  console.log("Requesting", url);
  request({
    url: url,
    timeout: config.worker.timeout,
    followRedirect: false
  }, callback);
}

function work(job, done) {
  var uri = job.data.uri;
  database.get(uri, function(err, reply) {
    var dbRecord;
    if (reply) {
      dbRecord = JSON.parse(reply);
      var lastUpdatedAt = parseInt(dbRecord.updatedAt, 16);
      if (dbRecord.scraperVersion == scraperVersion) {
        if (new Date().getTime() - lastUpdatedAt < config.worker.freshnessTime) {
          console.log(uri, "is still fresh");
          return;
        }
      }
    }
    makeRequest(uri, function(error, response, body) {
      var record = {
        uri: uri,
        updatedAt: new Date().getTime().toString(16),
        scraperVersion: scraperVersion
      };
      if (error) {
        record.error = error;
      }
      else {
        handleResponse(response, body, record);
      }
      console.log(record);

      if (!error || !dbRecord) {
        // Don't record error if there already is one
        database.set(uri, JSON.stringify(record));
      }
      done(record.error);
    });
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
