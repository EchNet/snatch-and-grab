/* scraper.js */

var component = "scraper";
var version = "0.1.1";

var request = require("request");

var App = require("./app.js").App;

var app = new App("crawler");

app.open([ "scraperQueue", "db" ], function(queue, db) {

  var host = app.config.site.host;
  var timeout = app.config.worker.timeout;
  var scrapeText = app.config.site.scrapeText;

  function lookupRecord(uri, callback) {
    db.collection.findOne({ uri: uri }, function(err, record) {
      if (err) {
        console.log(uri, "query error", err);
      }
      else {
        callback(record);
      }
    });
  }

  function doRequest(uri, callback) {
    var url = host + uri;
    request({
      url: url,
      timeout: timeout,
      followRedirect: false
    }, callback);
  }

  function updateRecord(response, text, record) {
    record.http_status = response.statusCode;
    record.updated_at = new Date();
    record.scraper_version = component + " " + version;
    record.content = null;
    if (response.statusCode == 200 &&
        response.headers["content-type"] == "text/html; charset=UTF-8") {
      record.content = scrapeText(text);
    }
  }

  function replaceRecord(uri, record, done) {
    db.collection.update({ uri: uri }, record, done);
  }

  function work(job, done) {
    var uri = job.data.uri;
    console.log("scrape", uri);
    lookupRecord(uri, function(record) {
      if (!record) {
        console.log(uri, "no such record");
      }
      else {
        doRequest(uri, function(error, response, text) {
          if (error) {
            console.log(uri, "request error", error);
          }
          else {
            updateRecord(response, text, record);
            replaceRecord(uri, record, done);
            return;
          }
        });
      }
      done();
    });
  }

  function process() {
    console.log("Processing...");
    queue.process(work);
  }

  if (app.args.clean) {
    collection.deleteMany({}, process);
  }
  else {
    process();
  }
});
