// wikipedia.js

var geoformat = require("./geoformat");
var extend = require("extend");
var AllHtmlEntities = require("html-entities").AllHtmlEntities;

function looksLikeArticlePage(text) {
  return text.indexOf(" ns-subject page") > 0;
}

function fixUri(uri) {
  return uri.replace(/\&amp\;/g, "&");
}

function crawlTextFunction(special, allPages, next) {

  function nextLinkInContextRegex() {
    return new RegExp(
      "<a href=\"(\\/w\\/index\\.php\\?title\\=[^:]+\\:[^\"]+\\&amp;from=[^\"]*)\" title=\"" + 
      special + 
      "\\:" +
      allPages +
      "\">" + 
      next +
      " ");
  }

  function crawlForNextLink(text, crawler) {
    var match;
    if (match = nextLinkInContextRegex().exec(text)) {
      crawler.crawl(fixUri(match[1]));
    }
  }

  function crawlForArticleLinks(text, crawler) {
    var articleLinkInContextRegex =
      /<li><a href="(\/wiki\/[^"][^"]*)" title=/g;
    var match;
    while (match = articleLinkInContextRegex.exec(text)) {
      crawler.recognize(fixUri(match[1]));
    }
  }

  return function(text, crawler) {
    crawlForNextLink(text, crawler);
    crawlForArticleLinks(text, crawler);
  };
}

function scrapeTextFunction(category) {

  return function(text) {
    var scrapage = null;
    if (looksLikeArticlePage(text)) {
      var geo;
      var match;
      var entities = new AllHtmlEntities();

      if (match = /<span class="latitude">([0-9][^<]*)</.exec(text)) {
        scrapage = extend(true, scrapage || {}, {
          geo: {
            latitude: geoformat.parseValue(match[1])
          }, 
          geo0: {
            latitude_text: match[1]
          }
        });
      }

      if (match = /<span class="longitude">([0-9][^<]*)</.exec(text)) {
        scrapage = extend(true, scrapage || {}, {
          geo: {
            longitude: geoformat.parseValue(match[1])
          }, 
          geo0: {
            longitude_text: match[1]
          }
        });
      }

      if (match = /<span class="geo-dec"[^>]*>([-0-9][^<]*)</.exec(text)) {
        geo = geoformat.parseLatLong(match[1]);
        if (geo) {
          scrapage = extend(true, scrapage || {}, { geo: geo, geo1: { text: match[1] } });
        }
      }

      if (match = /<span class="geo"[^>]*>([-0-9][^<]*)</.exec(text)) {
        geo = geoformat.parseLatLong(match[1]);
        if (geo) {
          scrapage = extend(true, scrapage || {}, { geo: geo, geo2: { text: match[1] } });
        }
      }

      if (scrapage != null) {
        if (match = /<h1 id="firstHeading" class="[^"]*" lang="[^"]*">(..*)<\/h1>/.exec(text)) {
          scrapage.title = entities.decode(match[1]);
        }

        scrapage.categories = [];
        var regex = new RegExp("<a href=\"\\/wiki\\/" + category +
            ":[^\"]*\" title=\"[^\"]*\">([^<]*)<\\/a>", "g");
        while (match = regex.exec(text)) {
          scrapage.categories.push(entities.decode(match[1]));
        }
      }
    }
    return scrapage;
  };
}

module.exports = {
  crawlTextFunction: crawlTextFunction,
  scrapeTextFunction: scrapeTextFunction
};
