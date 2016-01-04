/* enqueue.js */

var App = require("./app.js").App;

var app = new App("enqueue");
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
