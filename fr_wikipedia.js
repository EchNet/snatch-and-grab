// fr_wikipedia.js

var wikipedia = require("./wikipedia");

module.exports = {
  host: "https://fr.wikipedia.org",
  origin: "/wiki/Spécial:Toutes_les_pages",
  crawlText: wikipedia.crawlTextFunction("Spécial", "Toutes_les_pages", "Page suivante"),
  scrapeText: wikipedia.scrapeText
};
