/* master.js */

var component = "master";
var version = "0.1.1";

var App = require("./app.js").App;

var app = new App("master");

app.open([ "db", "scraperQueue", "crawlerQueue" ],
    function(db, scraperQueue, crawlerQueue) {

  var site = app.config.site;
  var crawlFreshnessTime = app.config.control.crawlFreshnessTime;
  var scrapeFreshnessTime = app.config.control.scrapeFreshnessTime;

  function defaultControlDoc() {
    return {
      site: site
    };
  }

  function lookupControlDoc(callback) {
    db.controlCollection.findOne({ site: site }, function(err, controlDoc) {
      if (err) {
        app.abort(uri, "query error", err);
      }
      else if (controlDoc == null) {
        controlDoc = defaultControlDoc();
        db.controlCollection.insertOne(controlDoc, callback);
      }
      else {
        callback(controlDoc);
      }
    });
  }

  function updateControlDoc(controlDoc, callback) {
    controlDoc.updated_at = new Date();
    db.controlCollection.replaceOne({
      site: site
    }, controlDoc, function(err, results) {
      callback();
    });
  }

  function appendUris(results, uris) {
    if (results) {
      for (var i = 0; i < results.length; ++i) {
        uris.push(results[i].uri);
      }
    }
  }

  function getUnscrapedUris(uris, max, callback) {
    db.collection.find({
      updated_at: { "$exists": false }
    }, {
      uri: 1
    }, {
      limit: max
    }, function(err, results) {
      appendUris(results, uris);
      callback();
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
    }, function(err, results) {
      appendUris(results, uris);
      callback();
    });
  }

  function feedScraper(controlDoc, callback) {
    var max = app.config.control.scrapesPerQuantum;
    var uris = [];
    app.executeSequence([
      function(done) {
        scraperQueue.inactiveCount(function(err, total) {
          if (!err) {
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
          getUnscrapedUris(uris, max, done);
        }
      },
      function(done) {
        if (max == 0 || uris.length == max) {
          done();
        }
        else {
          getStaleUris(uris, max, done);
        }
      },
      function(done) {
        for (var i = 0; i < uris.length; ++i) {
          queue.enqueue(uris[i]);   // fire and forget
        }
        done();
      }
    ], callback);
  }

  function feedCrawler(controlDoc, callback) {
    crawlerQueue.inactiveCount(function(err, total) {
      if (!err && total == 0) {
        var now = new Date().getTime();
        if (controlDoc.last_crawl_time == undefined ||
            now - controlDoc.last_crawl_time.getTime() > crawlFreshnessTime) {
          crawlerQueue.enqueue(app.config.site.origin);
        }
      }
    });
  }

  function work() {
    lookupControlDoc(function(controlDoc) {
      feedScraper(controlDoc, function() {
        feedCrawler(controlDoc, function() {
          updateControlDoc(controlDoc, function() {});
        });
      });
    });
  }

  setInterval(work, app.config.control.quantum);
});
