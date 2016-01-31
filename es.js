/* es.js */

var elasticsearch = require("elasticsearch");

function openElasticSearch(config, errorHandler) {
  console.log("Initializing ElasticSearch client...", config);

  var client = new elasticsearch.Client(config);

  return {
    listIndexes: function(callback) {
      client.cat.indices({ "v": true }, function(err, response, status) {
        if (err) {
          errorHandler("ES cat.indices error", err);
        }
        else {
          var text = response.split("\n");
          text.shift();  // toss column headers
          callback(text.map(function(item) {
            var words = item.split(/\s+/);
            return words.length > 2 ? words[2] : "";
          }));
        }
      });
    },
    createIndex: function(indexName, config, callback) {
      client.indices.create({
        index: indexName,
        body: config
      }, function(err, response, status) {
        if (err) {
          errorHandler("ES indices.create error", err);
        }
        else {
          callback(response);
        }
      });
    },
    dropIndex: function(indexName, callback) {
      client.indices.delete({
        index: indexName
      }, function(err, response, status) {
        if (err) {
          errorHandler("ES indices.delete error", err);
        }
        else {
          callback(response);
        }
      });
    },
    insert: function(indexName, docType, doc, callback) {
      client.create({
        index: indexName,
        type: docType,
        body: doc
      }, function(err, response, status) {
        if (err) {
          errorHandler("ES client.create error", err);
        }
        else {
          callback(response);
        }
      });
    },
    bulkInsert: function(indexName, docType, docs, callback) {
      var body = [];
      for (var i = 0; i < docs.length; ++i) {
        body.push({ index: {} });
        body.push(docs[i]);
      }
      client.bulk({
        index: indexName,
        type: docType,
        body: body
      }, function(err, response, status) {
        if (err) {
          errorHandler("ES client.bulk error", err);
        }
        else {
          callback(response);
        }
      });
    },
    geoFilter: function(indexName, docType, location, callback) {
      client.search({
        index: indexName,
        type: docType,
        body: {
          "size": 10,
          "query": {
            "function_score": {
              "functions": [
                {
                  "gauss": {
                    "location": {
                      origin: location,
                      scale: "5km"
                    }
                  }
                }
              ]
            }
          }
        }
      }).then(callback, function(err) {
        // TODO: report error to client
        console.log(err);
      });
    }
  };
}

module.exports = {
  openElasticSearch: openElasticSearch
};
