// en_wikipedia.js

var wikipedia = require("./wikipedia");

module.exports = {
  host: "https://en.wikipedia.org",
  origin: "/wiki/Special:AllPages",
  crawlText: wikipedia.crawlTextFunction("Special", "AllPages", "Next"),
  scrapeText: wikipedia.scrapeTextFunction("Category")
};
