/* indexer.js */

var fs = require("fs");
var readline = require("readline");

var PipelineApp = require("./app").PipelineApp;
var app = new PipelineApp("indexer");

app.open([ "elasticsearch" ], function(elasticsearch) {

  var indexName = app.args.index;
  var chunkSize = app.args.chunk || 1000;

  var inFileName = app.args["in"];
  if (!inFileName) {
    app.abort("no input file name?");
    return;
  }

  // Drop the index
  function dropIndex(callback) {
    app.info("drop index", { index: indexName });
    elasticsearch.dropIndex(indexName, callback);
  }

  // Find the next available index name
  function nextAvailableIndexName(callback) {
    elasticsearch.listIndexes(function(indexes) {
      app.info("list indexes", { indexes: indexes });
      for (var n = 0; ; ++n) {
        var name = app.params.site + n;
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
    app.info("creating index", { indexName: indexName });
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

  // Reformat MongodDB document for insertion into ES index.
  function reformatItem(item) {
    return {
      "uri": item.uri,
      "title": item.content.title,
      "location": [ item.content.geo.longitude, item.content.geo.latitude ]     // careful - reverse the order!
    };
  }

  // Load documents into the index in bulk.
  function loadIndex(callback) {
    var indexCount = 0;
    var buffer = [];
    var rd = readline.createInterface({
      input: fs.createReadStream(inFileName),
      terminal: false
    });

    function flush(callback) {
      rd.pause();
      elasticsearch.bulkInsert(indexName, "page", buffer, function() {
        app.info("Indexed items", { indexCount: indexCount });
        buffer = [];
        rd.resume();
        callback && callback();
      });
    }

    rd.on("close", function() {
      app.info("input stream closed");
      if (buffer.length > 0) {
        flush(callback);
      }
      else {
        callback();
      }
    });

    rd.on("line", function(line) {
      var item = JSON.parse(line);
      app.info("line", { item: item });
      ++indexCount;
      buffer.push(reformatItem(item));
      if (indexCount % chunkSize == 0) {
        flush();
      }
    });
  }

  app.executeSequence([
    (indexName ? dropIndex : nextAvailableIndexName),
    createIndex,
    loadIndex
  ], function() {
    app.exit(0);
  });
});
