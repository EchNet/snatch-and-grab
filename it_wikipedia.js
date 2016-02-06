// it_wikipedia.js

var wikipedia = require("./wikipedia");

module.exports = {
  host: "https://it.wikipedia.org",
  origin: "/w/index.php?title=Speciale:Prefissi&namespace=0",
  crawlText: wikipedia.crawlTextFunction("Speciale", "Prefissi", "Pagina successiva"),
  scrapeText: wikipedia.scrapeText
};
