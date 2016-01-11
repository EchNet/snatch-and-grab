/* es.js */

var request = require("request");

function openElasticSearch(config, errorHandler) {
  console.log("Initializing ElasticSearch client...");

  var url = config.url;
  var timeout = config.timeout;

  return {
    listIndexes: function(callback) {
      request({
        url: url + "/_cat/indices?v",
        timeout: timeout
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
      var dat_url = url + "/" + indexName + "/" + docType + "/_search";
  console.log(dat_url);
      request({
        method: "GET",
        url: url + "/" + indexName + "/" + docType + "/_search",
        json: {
          "bool": {
            "must": {
              "match_all": {}
            },
            "filter": {
              "geo_distance": {
                "distance": distance,
                "content.geo.location": location
              }
            }
          }
        }
      }, function(err, response, text) {
        callback(text);
      });
    }
  };
}

module.exports = {
  openElasticSearch: openElasticSearch
};
