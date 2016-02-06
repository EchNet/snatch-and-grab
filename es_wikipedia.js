// es_wikipedia.js

var wikipedia = require("./wikipedia");

module.exports = {
  host: "https://es.wikipedia.org",
  origin: "/wiki/Especial:Todas",
  crawlText: wikipedia.crawlTextFunction("Especial", "Todas", "Next"),
  scrapeText: wikipedia.scrapeText
};
