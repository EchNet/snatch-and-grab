/* schema.js */

var version = "0.1.1";

var App = require("./app.js").App;

var app = new App("schema");

app.open("db", function(db) {
  app.executeSequence([
    function(go) {
      console.log("indexing uri field...");
      db.collection.createIndex({ uri: 1 }, { unique: true }, go);
    },
    function(go) {
      console.log("indexing updated_at field...");
      db.collection.createIndex({ updated_at: 1 }, { sparse: true }, go);
    },
    function(go) {
      console.log("indexing scraper_version field...");
      db.collection.createIndex({ scraper_version: 1 }, { sparse: true }, go);
    }
  ], function() {
    app.exit();
  });
});
