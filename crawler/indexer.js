/* indexer.js */

var version = "0.1.1";

var request = require("request");

var App = require("./app").App;

var app = new App("indexer");

var docType = "page";

app.open([ "db", "elasticsearch" ], function(db, elasticsearch) {

  var indexName;
  var indexCount = 0;

  // Find the next available index name
  function nextAvailableIndexName(callback) {
    elasticsearch.listIndexes(function(indexes) {
      for (var n = 0; ; ++n) {
        var name = docType + "s" + n;
        if (indexes.indexOf(name) < 0) {
          indexName = name;
          break;
        }
      }
      callback();
    });
  }

  // Create the index and specify its metadata.
  function createIndex(callback) {
    console.log("creating index", indexName);
    // Create the mappings for the index.  Define the location field.
    elasticsearch.createIndex(indexName, {
      mappings: {
        page: {
          "_all": { "enabled": false },
          properties: {
            title: { type: "string" },
            location: { type: "geo_point" }
          }
        }
      }
    }, callback);
  }

  // Load data into the index.
  function loadIndex(callback) {
    console.log("loading index", indexName);
    db.collection.find({
      "content.geo": { "$exists": 1 }
    }, {
      uri: 1,
      title: 1,
      content: 1
    }, function(err, cursor) {
      if (err) {
        app.abort("mongo query failed", err);
      }
      (function next() {
        cursor.nextObject(function(err, item) {
          if (err) {
            app.abort("mongdo cursor failed", err);
          }
          else if (!item) {
            callback();
          }
          else {
            console.log("insert", item.uri);
            ++indexCount;
            elasticsearch.insert(indexName, docType, {
              "uri": item.uri,
              "title": item.content.title,
              "location": [ item.content.geo.longitude, item.content.geo.latitude ]     // careful - reverse the order!
            }, next);
          }
        });
      })();
    });
  }

  app.executeSequence([
    nextAvailableIndexName,
    createIndex,
    loadIndex
  ], function() {
    console.log("Indexed items:", indexCount);
    app.exit(0);
  });
});

// QUERY like this.
/***
function filterDat() {
  var distanceUnits = [ "mi", "yd", "ft", "in", "km", "m", "cm", "mm", "nmi ];
  return {
    "query": {
      "filtered": {
        "filter": {
          "geo_distance": {
            "distance": "1km",
            "location": [ -73.988, 40.715 ]
          }
        }
      }
    }
  };
}
***/
