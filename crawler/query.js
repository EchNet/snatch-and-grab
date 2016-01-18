/* query.js */

var App = require("./app").App;

var app = new App("query");

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

  elasticsearch.geoFilter(indexName, "page", [ longitude, latitude ], function(results) {
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
      app.exit(0);
    }
  });
});
