/* server.js */

var express = require("express");
var extend = require("extend");
var geolib = require("geolib");

var App = require("./app").App;

var app = new App("server");

var server = express();

// Static assets.
server.use(express.static("www"));

// Geo-search endpoint.
server.get("/whwh", function (req, res) {

  app.info("request", { uri: "/whwh", query: req.query });

  function ok(hits) {
    res.json({ status: "ok", results: hits });
  }

  function error(errmsg) {
    res.json({ status: "error", msg: errmsg });
  }

  var params = {
    latitude: parseFloat(req.query.lat),
    longitude: parseFloat(req.query.long),
    lang: req.query.lang || "en",
    index: req.query.hash
  };

  if (isNaN(params.latitude)) {
    return error("latitude must be a number");
  }
  if (isNaN(params.longitude)) {
    return error("longitude must be a number");
  }

  // just Wikipedia for now
  var site = params.lang + "_wikipedia";
  var siteInfo = require("./" + site);

  function postProcessHits(hits) {
    return hits.filter(function(hit) {
      return hit._score > 0;
    }).map(function(hit) {
      return {
        url: siteInfo.host + hit._source.uri,
        title: hit._source.title,
        loc: hit._source.location,
        d: geolib.getDistance({ latitude: params.latitude, longitude: params.longitude },
          { latitude: hit._source.location[1], longitude: hit._source.location[0] })
      };
    });
  }

  app.open([ "system", "elasticsearch" ], function(system, elasticsearch) {

    var index = params.index || system.sites[params.site].index;

    var location = [ params.longitude, params.latitude ];

    app.info("search query", { index: index, location: location });

    elasticsearch.geoFilter(index, "page", location, function(results) {
      app.info("search results", { location: location, results: results });
      var data = results.hits && results.hits.hits ? postProcessHits(results.hits.hits) : [];
      app.info("response", { uri: "/whwh", data: data });
      ok(data);
    });
  });
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

// Stats endpoint.
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
