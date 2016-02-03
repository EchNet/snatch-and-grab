/* enqueue.js */

var PipelineApp = require("./app").PipelineApp;

var app = new PipelineApp("enqueue");
var queueId = app.args.queue || "crawlerQueue";

app.open(queueId, function(queue) {
  var sources = app.args._.length ? app.args._ : [ app.config.site.origin ];
  var sequence = sources.map(function(uri) {
    return function(done) {
      queue.enqueue(uri, done);
    };
  });
  app.executeSequence(sequence, function() {
    app.exit();
  });
});
