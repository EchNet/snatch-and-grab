/* crawler.js */

var request = require("request");
var fs = require("fs");

var PipelineApp = require("../app").PipelineApp;

var app = new PipelineApp("crawler");

// Configuration properties
var host = app.config.site.host;
var originUri = app.config.site.origin;
var timeout = app.config.request.timeout;

var outFileName = app.args.out || ("data/" + app.params.site + ".list");
var outFile = fs.createWriteStream(outFileName, { encoding: "utf8" });
outFile.on("error", function(err) {
  app.abort("Error writing to " + outFile, err);
});

app.open([], function() {

  // Parse one index file at a time.
  var nextUri = app.args.start || originUri;

  // The crawler parse function
  var crawlText = app.config.site.crawlText;

  (function work() {
    var uri = nextUri;
    if (uri == null) {
      app.info("end of listing");
      outFile.on("finish", function() {
        app.exit(0);
      });
      outFile.end();
    }
    else {
      nextUri = null;
      // Issue a Web page request.
      var url = host + uri;
      app.info("request", { url: url });
      request({
        url: url,
        timeout: timeout,
        followRedirect: false
      }, function(error, response, text) {
        if (error) {
          app.abort(url + ": request error", error);
        }
        else if (response.statusCode != 200) {
          app.abort(url + ": bad HTTP status code " + response.statusCode);
        }
        else if (!/^text/.exec(response.headers["content-type"])) {
          app.abort(url + ": bad content type " + response.headers["content-type"]);
        }
        else {
          app.info("response", { url: url });
          var recogCount = 0;
          // Handle Web page response.
          crawlText(text, {
            crawl: function(hrefUri) {
              nextUri = hrefUri;
            },
            recognize: function(hrefUri) {
              outFile.write(hrefUri + "\n");
              ++recogCount;
            }
          });
          app.info("recognized " + recogCount);
          work();
        }
      });
    }
  })();
});
