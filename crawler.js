/* crawler.js */

var request = require("request");
var fs = require("fs");

var App = require("./app").App;

var app = new App("crawler");

// Configuration properties
var host = app.config.site.host;
var originUri = app.config.site.origin;
var timeout = app.config.request.timeout;

var outFileName = app.args.out || "crawler.out";
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
      outFile.on("finish", function() {
        app.exit(0);
      });
      outFile.end();
    }
    else {
      nextUri = null;
      // Issue a Web page request.
      request({
        url: host + uri,
        timeout: timeout,
        followRedirect: false
      }, function(error, response, text) {
        if (error) {
          app.abort(uri + ": request error", error);
        }
        else if (response.statusCode != 200) {
          app.abort(uri + ": bad HTTP status code " + response.statusCode);
        }
        else if (response.headers["content-type"] != "text/html; charset=UTF-8") {
          app.abort(uri + ": bad content type " + response.headers["content-type"]);
        }
        else {
          // Handle Web page response.
          crawlText(text, {
            crawl: function(hrefUri) {
              nextUri = hrefUri;
            },
            recognize: function(hrefUri) {
              outFile.write(hrefUri + "\n");
            }
          });
          work();
        }
      });
    }
  })();
});
