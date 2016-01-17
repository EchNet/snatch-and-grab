/* es.js */

var elasticsearch = require("elasticsearch");
var request = require("request");

function openElasticSearch(config, errorHandler) {
  console.log("Initializing ElasticSearch client...");

  var url = "http://" + config.host;
  var client = new elasticsearch.Client(config);

  return {
    listIndexes: function(callback) {
      request({
        url: url + "/_cat/indices?v"
      }, function(err, response, text) {
        if (err) {
          errorHandler("ES request error", err);
        }
        else {
          callback(text.split("\n").map(function(item) {
            var words = item.split(/\s+/);
            return words.length > 2 ? words[2] : ""
          }));
        }
      });
    },
    createIndex: function(indexName, config, callback) {
      request({
        method: "PUT",
        url: url + "/" + indexName,
        json: config
      }, function(err, response, text) {
        if (err) {
          errorHandler("ES create index error", err);
        }
        else {
          callback(text);
        }
      });
    },
    insert: function(indexName, docType, doc, callback) {
      request({
        method: "POST",
        url: url + "/" + indexName + "/" + docType + "/",
        json: doc
      }, function(err, response, text) {
        if (err) {
          errorHandler("ES insert error", err);
        }
        else {
          callback();
        }
      });
    },
    geoFilter(indexName, docType, location, distance, callback) {
      client.search({
        index: indexName,
        type: docType,
        body: {
          "size": 10,
          "query": {
            "bool": {
              "must": {
                "match_all": {}
              },
              "filter": {
                "geo_distance": {
                  "distance": "20km",
                  "location": location
                }
              }
            }
          }
        }
      }).then(callback, function(err) {
        console.log(err);
      });
    },
    geoFilter2(indexName, docType, location, distance, callback) {
      client.search({
        index: indexName,
        type: docType,
        body: {
          "size": 10,
          "query": {
            "function_score": {
              "functions": [
                {
                  "linear": {
                    "location": {
                      "origin": { lon: -7.6 , lat: 52.3 },
                      "offset": "100m",
                      "scale": "100m"
                    }
                  }
                }
              ]
            }
          }
        }
      }).then(callback, function(err) {
        console.log(err);
      });
    }
  };
}

module.exports = {
  openElasticSearch: openElasticSearch
};
