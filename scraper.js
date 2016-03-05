/* scraper.js */

var fs = require("fs");
var request = require("request");
var lineReader = require("line-reader");

var PipelineApp = require("./app").PipelineApp;
var app = new PipelineApp("scraper");

var timeout = app.config.request.timeout;
var scrapeText = app.config.site.scrapeText;

var inFileName = app.args["in"];
var outFileName = app.args.out || ("data/" + app.params.site + ".data");
var outFile = fs.createWriteStream(outFileName, { flags: "w+" });

app.open("scraperQueue", function(queue) {

  function enqueue(uri) {
    queue.enqueue({ uri: uri });
  }

  function seedQueue() {
    if (inFileName) {
      app.info("clearing queue...");
      queue.clear(function() {
        app.info("queue cleared");
        if (inFileName.length && inFileName.charAt(0) == "@") {
          enqueue(inFileName.substring(1));
        }
        else {
          var lineCount = 0;
          lineReader.eachLine(inFileName, function(line, last) {
            enqueue(line);
            ++lineCount;
            if (last) {
              app.info("enqueued: " + lineCount);
            }
          });
        }
      });
    }
    else {
      app.info("restarting queue");
      queue.restartJobs();
    }
  }

  function scrapeOne(uri, done) {
    var host = app.config.site.host;
    var url = host + uri;
    request({
      url: url,
      timeout: timeout,
      followRedirect: false
    }, function(err, response, text) {
      if (err) {
        app.error("request error", { url: url, error: err });
        enqueue(uri);  // requeue
        done();
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
        var content = scrapeText(text);
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

  function getToWork() {
    queue.process(function(job, done) {
      scrapeOne(job.data.uri, done);
    });
  }

  function startReaper() {
    setInterval(function() {
      queue.ifEmpty(function() {
        outFile.close(function() {
          app.exit(0);
        });
      });
    }, 10000);
  }

  seedQueue();
  getToWork();
  startReaper();
});
