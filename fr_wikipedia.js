// fr_wikipedia.js

var wikipedia = require("./wikipedia");

module.exports = {
  host: "https://fr.wikipedia.org",
  origin: "/wiki/Sp%C3%A9cial:Toutes_les_pages",
  crawlText: wikipedia.crawlTextFunction("Spécial", "Toutes les pages", "Page suivante"),
  scrapeText: wikipedia.scrapeTextFunction("Cat%C3%A9gorie")
};
