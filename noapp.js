/* noapp.js */

// An app that does nothing.

var App = require("./app").App;
var app = new App("noapp");
app.open([], function() {
  app.log("info", "log this");
  app.info("some info");
  app.debug("some debugging");
  app.warn("a warning");
  app.error("an error");
  app.exit(0);
});
