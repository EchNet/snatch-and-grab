/* initdb.js */

var PipelineApp = require("./app").PipelineApp;

var app = new PipelineApp("initdb");

app.open("db", function(db) {
  app.executeSequence([
    function(go) {
      console.log("checking collection " + app.config.params.site + "...");
      db.collection.count(function(err, count) {
        if (err) {
          app.abort("database error", err);
        }
        else if (count > 0 && !app.args.recreate) {
          console.log("collection already exists. if you wish to recreate it, specify --recreate");
          app.exit(1);
        }
        go();
      });
    },
    function(go) {
      db.collection.remove({}, go);
    },
    function(go) {
      console.log("indexing uri field...");
      db.collection.createIndex({ uri: 1 }, { unique: true }, go);
    },
    function(go) {
      console.log("indexing updated_at field...");
      db.collection.createIndex({ updated_at: 1 }, { sparse: true }, go);
    }
  ], function() {
    app.exit();
  });
});
