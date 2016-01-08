
// This looks like code, but I'm just taking notes here.

//
// First, create an index.  This is your way to alternate between the in-use index and the one that's being build.
// From the ElasticSearch Geo Points chapter.
//
function createAnIndex() {
  var indexName = "my_index";
  // Create the mappings for the index.  Define the location field.
  return {
    mappings: {
      page: {
        "_all": { "enabled": false },
        properties: {
          title: "string"
        },
        location: {
          type: "geo_point"
        }
      }
    }
  };
}

// LOAD data in like this
function preferredFormat() {
  // curl -XPUT "http://localhost:9200/index_name/doc_type/_id -d '{}'
  return {
    "uri": "/wiki/Piazza_Navona",
    "title": "Piazza Navona",
    "location": [ 12.5, 41.5 ]     // careful - reverse the order!
  };
}

// QUERY like this.
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

// When swapping indexes, delete the old one like this...
