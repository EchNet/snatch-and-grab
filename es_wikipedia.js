// es_wikipedia.js

var wikipedia = require("./wikipedia");

module.exports = {
  host: "https://es.wikipedia.org",
  origin: "/wiki/Especial:Todas",
  crawlText: wikipedia.crawlTextFunction("Especial", "Todas", "Siguiente página"),
  scrapeText: wikipedia.scrapeTextFunction("Categor%C3%ADa")
};
