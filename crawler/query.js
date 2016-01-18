/* query.js */

var App = require("./app").App;

var app = new App("query");

var docType = "page";

app.open([ "elasticsearch" ], function(elasticsearch) {

  var indexName = app.args.index || "pages0";

  var latitude = parseFloat(app.args.lat);
  if (isNaN(latitude)) {
    app.abort("latitude must be a number");
  }
  var longitude = parseFloat(app.args.long);
  if (isNaN(longitude)) {
    app.abort("longitude must be a number");
  }

  // Load data into the index.
  function query(callback) {
    var location = { lon: longitude, lat: latitude };
    var rx = 0;

    (function filter() {
      elasticsearch.geoFilter(indexName, docType, location, function(results) {
        if (results.hits && results.hits.hits) {
          console.log("Results", "(" + results.hits.total + ")");
          for (var i = 0; i < results.hits.hits.length; ++i) {
            var hit = results.hits.hits[i];
            console.log("---");
            console.log(" ", "url:", app.config.site.host + hit._source.uri);
            console.log(" ", "title:", hit._source.title);
            console.log(" ", "location:", hit._source.location);
            console.log(" ", "score:", hit._score);
          }
          callback();
        }
        else {
          filter();
        }
      });
    })();
  }

  query(function() {
    app.exit(0);
  });
});
