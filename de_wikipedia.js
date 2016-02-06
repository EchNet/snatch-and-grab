// de_wikipedia.js

var wikipedia = require("./wikipedia");

module.exports = {
  host: "https://de.wikipedia.org",
  origin: "/wiki/Spezial:Alle_Seiten",
  crawlText: wikipedia.crawlTextFunction("Spezial", "Alle Seiten", "N.chste"),
  scrapeText: wikipedia.scrapeText
};
