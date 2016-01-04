/* crawl_control.js */

var App = require("./app.js").App;

var app = new App("crawl_control");

var site = app.config.params.site;
var crawlFreshnessTime = app.config.control.crawlFreshnessTime;

function defaultControlDoc() {
  return {
    site: site
  };
}

function lookupControlDoc(db, callback) {
  db.controlCollection.findOne({ site: site }, function(err, controlDoc) {
    if (err) {
      app.abort(uri, "query error", err);
    }
    else if (!controlDoc) {
      controlDoc = defaultControlDoc();
      console.log("initialize control doc", controlDoc);
      db.controlCollection.insertOne(controlDoc, callback);
    }
    else {
      console.log("fetched control doc", controlDoc);
      callback(controlDoc);
    }
  });
}

function updateControlDoc(db, controlDoc, callback) {
  controlDoc.updated_at = new Date();
  db.controlCollection.replaceOne({
    site: site
  }, controlDoc, function(err, results) {
    console.log("updated control doc", controlDoc);
    callback();
  });
}

function feedCrawler(controlDoc, callback) {
  app.open("crawlerQueue", function(crawlerQueue) {
    crawlerQueue.inactiveCount(function(err, total) {
      if (err) {
        console.log("error accessing crawler queue", err);
      }
      else if (total > 0) {
        console.log("crawler is busy");
      }
      else {
        var now = new Date().getTime();
        if (controlDoc.last_crawl_time == undefined ||
            now - controlDoc.last_crawl_time.getTime() > crawlFreshnessTime) {
          crawlerQueue.enqueue(app.config.site.origin);
        }
        else {
          console.log("crawler has run recently");
        }
      }
      callback();
    });
  });
}

app.open("db", function(db) {
  lookupControlDoc(db, function(controlDoc) {
    feedCrawler(controlDoc, function() {
      updateControlDoc(db, controlDoc, function() {
        process.exit();
      });
    });
  });
});
