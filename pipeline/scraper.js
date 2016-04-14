/* scraper.js */

var fs = require("fs");
var request = require("request");

var PipelineApp = require("../app").PipelineApp;
var app = new PipelineApp("scraper");

var inFileName = app.args["in"];
var outFileName = app.args.out || ("data/" + app.params.site + ".data");
var outFile = fs.createWriteStream(outFileName, { flags: "w+" });

var workerCount = 0;
var fd;
var leftover = "";
var bufferSize = 1024;
var buffer = new Buffer(bufferSize);

function getNextUri() {
  var eol, uri, cc;
  for (;;) {
    eol = leftover.indexOf("\n");
    if (eol >= 0) {
      uri = leftover.substring(0, eol);
      leftover = leftover.substring(eol + 1);
      break;
    }
    cc = fs.readSync(fd, buffer, 0, bufferSize, null);
    if (cc <= 0) {
      if (leftover.length) {
        uri = leftover;
        leftover = "";
      }
      break;
    }
    leftover += buffer.toString("ascii", 0, cc);
  }
  return uri;
}

function doScrapeOne(uri, done, onError) {
  var host = app.config.site.host;
  var url = host + uri;
  request({
    url: url,
    timeout: app.config.request.timeout,
    followRedirect: false
  }, function(err, response, text) {
    if (err) {
      onError(url, err);
    }
    else if (response.statusCode != 200) {
      app.warn("bad status code", { url: url, statusCode: response.statusCode });
      done();
    }
    else if (!/^text/.exec(response.headers["content-type"])) {
      app.warn("unexpected content type", { url: url, error: err });
      done();
    }
    else {
      var content = app.config.site.scrapeText(text);
      if (content != null) {
        var record = {
          uri: uri,
          content: content
        };
        app.info("scrape", record);
        outFile.write(JSON.stringify(record) + "\n");
      }
      done();
    }
  });
}

function scrapeOne(uri, done) {
  var tries = 0;
  (function tryIt() {
    ++tries;
    doScrapeOne(uri, done, function(url, err) {
      if (tries > app.config.request.retries) {
        app.abort("request error", { url: url, error: err });
      }
      else {
        setTimeout(tryIt, app.config.request.timeout);
      }
    });
  })();
}

function exit() {
  app.exit(0);
}

function work() {
  ++workerCount;
  (function next() {
    var uri = getNextUri();
    if (!uri) {
      if (--workerCount == 0) {
        exit();
      }
    }
    else {
      scrapeOne(uri, next);
    }
  })();
}

if (!inFileName) {
  app.abort("no input file name?");
}
else if (inFileName.length && inFileName.charAt(0) == "@") {
  scrapeOne(inFileName.substring(1), exit);
}
else {
  fd = fs.openSync(inFileName, "r");
  for (var i = 0; i < app.config.scraperQueue.concurrency; ++i) {
    setTimeout(work, 1);
  }
}
