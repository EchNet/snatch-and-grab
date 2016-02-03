/* scraper.js */

var version = "0.1.1";

var request = require("request");

var App = require("./app").App;

var app = new App("scraper");

app.open([ "scraperQueue", "db" ], function(queue, db) {

  var host = app.config.site.host;
  var timeout = app.config.request.timeout;
  var scrapeText = app.config.site.scrapeText;

  function work(job, done) {
    var uri = job.data.uri;
    db.collection.findOne({ uri: uri }, function(err, record) {
      if (err) {
        console.log(uri, "query error", err);
        done();
      }
      else if (!record) {
        console.log(uri, "no such record");
        done();
      }
      else {
        var priorContent = record.content;
        request({
          url: host + uri,
          timeout: timeout,
          followRedirect: false
        }, function(err, response, text) {
          if (err) {
            console.log(uri, "request error", err);
            done();
          }
          else {
            record.http_status = response.statusCode;
            record.updated_at = new Date();
            if (response.statusCode >= 300 && response.statusCode < 500) {
              record.content = null;
            }
            if (response.statusCode == 200 &&
                response.headers["content-type"] == "text/html; charset=UTF-8") {
              record.content = scrapeText(text);
            }
            console.log(uri, response.statusCode, (function() {
              if (record.content && !priorContent) {
                return record.content.geo ? "first scrape - GEO" : "first scrape";
              }
              else if (record.content && priorContent) {
                return (record.content.geo && !priorContent.geo) ? "rescrape - GEO" : "rescrape";
              }
              else {
                return priorContent ? "content discarded" : "";
              }
            })());
            db.collection.update({ uri: uri }, record, done);
          }
        });
      }
    });
  }

  queue.process(work);
});
