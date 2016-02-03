/* scrape_control.js */

var App = require("./app").App;

var app = new App("scrape_control");

var site = app.config.params.site;
var scrapeFreshnessTime = app.config.control.scrapeFreshnessTime;
var scrapesPerQuantum;

app.open([ "db", "scraperQueue" ], function(db, queue) {

  function appendUris(cursor, uris, callback) {
    if (cursor) {
      cursor.toArray(function(err, array) {
        if (array) {
          for (var i = 0; i < array.length; ++i) {
            uris.push(array[i].uri);
          }
          callback();
        }
      });
    }
  }

  function getUnscrapedUris(uris, max, callback) {
    db.collection.find({
      updated_at: { "$exists": false }
    }, {
      uri: 1
    }, {
      limit: max
    }, function(err, cursor) {
      appendUris(cursor, uris, callback);
    });
  }

  function getStaleUris(uris, max, callback) {
    var cutoffTime = new Date(new Date().getTime() - scrapeFreshnessTime);
    db.collection.find({
      updated_at: { "$lt": cutoffTime }
    }, {
      uri: 1
    }, {
      limit: max,
      sort: "updated_at"
    }, function(err, cursor) {
      appendUris(cursor, uris, callback);
    });
  }

  function work() {
    var max;
    var uris = [];

    app.executeSequence([
      function(done) {
        queue.inactiveCount(function(err, total) {
          if (err) {
            console.log("error accessing scraper queue", err);
          }
          else {
            console.log("waiting scrape jobs", total);
            if (total == 0 && scrapesPerQuantum) {
              // As long as scraper keeps up, increase the rate by 20%. 
              scrapesPerQuantum = Math.round(scrapesPerQuantum * 1.2);
            }
            else if (!scrapesPerQuantum) {
              scrapesPerQuantum = app.config.control.initialScrapesPerQuantum;
            }
            else if (scrapesPerQuantum > total/2) {
              scrapesPerQuantum -= Math.floor(total/2);
            }
            max = scrapesPerQuantum;
            max -= Math.min(max, total);
          }
          done();
        });
      },
      function(done) {
        if (max == 0) {
          done();
        }
        else {
          console.log("fetching unscraped, max", max);
          getUnscrapedUris(uris, max, done);
        }
      },
      function(done) {
        if (max == 0 || uris.length == max) {
          done();
        }
        else {
          console.log("fetching stale, max", max);
          getStaleUris(uris, max, done);
        }
      },
    ], function() {
      app.executeSequence(uris.map(function(uri) {
        return function(done) {
          queue.enqueue(uri, done);
        };
      }));
    });
  }

  if (app.args.clear) {
    queue.clear();
  }
  else {
    queue.restartJobs();
  }

  setInterval(work, app.config.control.quantum);
  work();
});
