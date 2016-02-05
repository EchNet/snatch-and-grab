/* indexer.js */

var request = require("request");

var App = require("./app").App;

var app = new App("indexer");

var docType = "page";

app.open([ "db", "elasticsearch" ], function(db, elasticsearch) {

  var indexName = app.args.index;
  var chunkSize = app.args.chunk || 1000;

  // Drop the index
  function dropIndex(callback) {
    elasticsearch.dropIndex(indexName, callback);
  }

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

  // Load documents into the index, one at a time.
  function loadIndexSingly(cursor, callback) {
    var indexCount = 0;
    (function next() {
      cursor.nextObject(function(err, item) {
        if (err) {
          app.abort("mongdo cursor failed", err);
        }
        else if (!item) {
          app.info("Indexed items", { indexCount: indexCount });
          callback();
        }
        else {
          app.info("insert", { uri: item.uri });
          ++indexCount;
          elasticsearch.insert(indexName, docType, reformatItem(item), next);
        }
      });
    })();
  }

  // Load documents into the index in bulk.
  function loadIndexBulk(cursor, callback) {
    var indexCount = 0;
    var buffer = [];
    function flush(callback) {
      elasticsearch.bulkInsert(indexName, docType, buffer, function() {
        app.info("Indexed items", { indexCount: indexCount });
        buffer = [];
        callback();
      });
    }
    (function next() {
      cursor.nextObject(function(err, item) {
        if (err) {
          app.abort("mongdo cursor failed", err);
        }
        else if (!item) {
          if (buffer.length > 0) {
            flush(callback);
          }
          else {
            callback();
          }
        }
        else {
          app.info("add", { uri: item.uri });
          ++indexCount;
          buffer.push(reformatItem(item));
          if (indexCount % chunkSize == 0) {
            flush(next);
          }
          else {
            next();
          }
        }
      });
    })();
  }

  // Query and load documents into the index.
  function loadIndex(callback) {
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
      (chunkSize <= 1 ? loadIndexSingly : loadIndexBulk)(cursor, callback);
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
