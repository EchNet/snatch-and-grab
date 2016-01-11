/* indexer.js */

var request = require("request");

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
    var location = [ longitude, latitude ];
    var radii = [ "10m", "30m", "90m", "270m", "810m" ];
    var rx = 0;

    (function filter() {
      elasticsearch.geoFilter(indexName, docType, location, radii[rx++], function(results) {
        if (results) {
        //if (results && results.length) {
          console.log("Results");
          console.log("-------");
          //for (var i = 0; i < results.length; ++i) {
            //console.log(results[i]);
          //}
          console.log(results);
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
