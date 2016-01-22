/* curl.js */

var args = require("yargs").argv;
var request = require("request");

if (args._.length == 0) {
  console.log("usage: node curl.js url");
  process.exit(1);
}

var url = args._[0];

request({
  url: url,
  timeout: 5000,
  followRedirect: false
}, function(err, response, text) {
  console.log("err", err);
  console.log("response", response);
  console.log("text", text);
  process.exit(0);
});

