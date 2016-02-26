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

  function seedQueue(done) {
    if (inFileName) {
      queue.clear(function() {
        lineReader.eachLine(inFileName, function(line, last) {
          enqueue(line);
          if (last) {
            done();
          }
        });
      });
    }
    else {
      queue.restartJobs(done);
    }
  }

  function getToWork() {
    queue.process(function(job, done) {
      var uri = job.data.uri;
      request({
        url: host + uri,
        timeout: timeout,
        followRedirect: false
      }, function(err, response, text) {
        if (err) {
          app.error("request error", { uri: uri, error: err });
          enqueue(uri);  // requeue
        }
        else if (response.statusCode != 200) {
          app.warn("bad status code", { uri: uri, error: err });
          done();
        }
        else if (!/^text/.exec(response.headers["content-type"])) {
          app.warn("unexpected content type", { uri: uri, error: err });
          done();
        }
        else {
          var content = scrapeText(text);
          if (content != null) {
            var record = {
              uri: uri,
              content: content
            };
            app.info("scrape", { uri: uri, content: content });
            outFile.write(JSON.format(content) + "\n");
          }
          done();
        }
      });
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

  seedQueue(function() {
    getToWork();
    startReaper();
  });
});
