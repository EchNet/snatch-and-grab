/* master.js */

var App = require("./app").App;

var app = new App("master");
var fork = require('child_process').fork;

function work() {
  console.log("master working...");
  fork('./scrape_control.js');
  //fork('./crawl_control.js');
}

setInterval(work, app.config.control.quantum);
work();
