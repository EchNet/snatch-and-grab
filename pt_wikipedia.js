// pt_wikipedia.js

var wikipedia = require("./wikipedia");

module.exports = {
  host: "https://pt.wikipedia.org",
  origin: "/wiki/Especial:Todas_as_p%C3%A1ginas",
  crawlText: wikipedia.crawlTextFunction("Especial", "Todas as páginas", "Página seguinte"),
  scrapeText: wikipedia.scrapeTextFunction("Categoria")
};
