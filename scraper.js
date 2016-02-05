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
        app.error("query error", { uri: uri, error: err });
        done();
      }
      else if (!record) {
        app.error("no such record", { uri: uri });
        done();
      }
      else {
        var priorUpdatedAt = record.updated_at;
        var priorContent = record.content;
        request({
          url: host + uri,
          timeout: timeout,
          followRedirect: false
        }, function(err, response, text) {
          if (err) {
            app.error("request error", { uri: uri, error: err });
            done();
          }
          else {
            record.updated_at = new Date();
            if (response.statusCode >= 300 && response.statusCode < 500) {
              // Throw out any prior content.
              record["$unset"] = { "content": "" };
            }
            else if (response.statusCode == 200 &&
                response.headers["content-type"] == "text/html; charset=UTF-8") {
              record.content = scrapeText(text);
            }
            app.info(priorUpdatedAt ? "rescrape" : "first scrape", { uri: uri, statusCode: response.statusCode, geo: !!record.content });
            db.collection.update({ uri: uri }, record, done);
          }
        });
      }
    });
  }

  queue.process(work);
});
