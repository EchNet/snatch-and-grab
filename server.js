/* server.js */

var express = require("express");
var extend = require("extend");

var App = require("./app").App;

var app = new App("server");

var server = express();

server.use(express.static("www"));

server.get("/whwh", function (req, res) {

  function ok(hits) {
    res.json({ status: "ok", results: hits });
  }

  function error(errmsg) {
    res.json({ status: "error", msg: errmsg });
  }

  var latitude = parseFloat(req.query.lat);
  var longitude = parseFloat(req.query.long);

  if (isNaN(latitude)) {
    error("latitude must be a number");
  }
  else if (isNaN(longitude)) {
    error("longitude must be a number");
  }
  else {
    app.open([ "system", "elasticsearch" ], function(system, elasticsearch) {

      var indexName = system.index || "pages0";

      elasticsearch.geoFilter(indexName, "page", [ longitude, latitude ], function(results) {
        ok((function() {
          if (results.hits && results.hits.hits) {
            return results.hits.hits.map(function(hit) {
              if (hit._score == 0) return undefined;
              return {
                url: app.config.site.host + hit._source.uri,
                title: hit._source.title,
                location: hit._source.location,
                // Distance would sure be nice.
                score: hit._score
              };
            }).filter(function(val) {
              return val != null;
            });;
          }
          return null;
        })());
      });
    });
  }
});

var statFunctions = {
  "npages": function(callback) {
    app.open("db", function(db) {
      db.collection.count({}, function(err, count) {
        callback(err ? -1 : count);
      });
    });
  },
  "ncontent": function(callback) {
    app.open("db", function(db) {
      db.collection.count({
        "content": { "$exists": 1 }
      }, function(err, count) {
        callback(err ? -1 : count);
      });
    });
  },
  "ngeo": function(callback) {
    app.open("db", function(db) {
      db.collection.count({
        "content.geo": { "$exists": 1 }
      }, function(err, count) {
        callback(err ? -1 : count);
      });
    });
  }
};

server.get("/stats", function(req, res) {
  var stats = {};
  var tasks = [];
  for (var statName in req.query) {
    if (req.query.hasOwnProperty(statName) && statFunctions[statName]) {
      tasks.push((function(statName) {
        return function(done) {
          (statFunctions[statName])(function(value) {
            stats[statName] = value;
            done();
          });
        };
      })(statName));
    }
  }
  app.executeSequence(tasks, function() {
    res.json({ status: "ok", stats: stats });
  });
});

server.listen(app.config.web.port, function () {
  app.info("Listening on port " + app.config.web.port);
});
