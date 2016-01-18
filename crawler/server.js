/* server.js */

var express = require('express');
var App = require("./app").App;

var app = new App("server");

var server = express();

server.use(express.static("../www"));

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
              return {
                url: app.config.site.host + hit._source.uri,
                title: hit._source.title,
                location: hit._source.location,
                // Distance would sure be nice.
                score: hit._score
              };
            });
          }
          return null;
        })());
      });
    });
  }
});

server.listen(app.config.web.port, function () {
  console.log("Listening on port " + app.config.web.port);
});
