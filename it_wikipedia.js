// en_wikipedia.js

var wikipedia = require("./wikipedia");
var extend = require("extend");

var host = "https://en.wikipedia.org";

module.exports = extend({ host: host, }, wikipedia);
