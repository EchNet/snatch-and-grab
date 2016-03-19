// wikipedia.js

var geoformat = require("./geoformat");
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

  function addGeoProp(scrapage, propName, propValue) {
    if (typeof propValue == "number") {
      scrapage = scrapage || {};
      scrapage.geo = scrapage.geo || {}
      scrapage.geo[propName] = propValue;
    }
    return scrapage;
  }

  function addLatitude(scrapage, propValue) {
    return addGeoProp(scrapage, "latitude", propValue);
  }

  function addLongitude(scrapage, propValue) {
    return addGeoProp(scrapage, "longitude", propValue);
  }

  function addGeo(scrapage, geo) {
    if (geo) {
      scrapage = addLatitude(scrapage, geo.latitude);
      scrapage = addLongitude(scrapage, geo.longitude);
    }
    return scrapage;
  }

  return function(text) {
    var scrapage = null;
    if (looksLikeArticlePage(text)) {
      var match;
      var entities = new AllHtmlEntities();

      if (match = /<span class="latitude">([^<]*)</.exec(text)) {
        scrapage = addLatitude(scrapage, geoformat.parseValue(match[1]));
      }

      if (match = /<span class="longitude">([^<]*)</.exec(text)) {
        scrapage = addLongitude(scrapage, geoformat.parseValue(match[1]));
      }

      if (match = /<span class="geo-dec"[^>]*>([^<]*)</.exec(text)) {
        scrapage = addGeo(scrapage, geoformat.parseLatLong(match[1]));
      }

      if (match = /<span class="geo"[^>]*>([^<]*)</.exec(text)) {
        scrapage = addGeo(scrapage, geoformat.parseLatLong(match[1]));
      }

      if (scrapage != null) {
        if (match = /<h1 id="firstHeading" class="[^"]*" lang="[^"]*">(..*)<\/h1>/.exec(text)) {
          scrapage.title = match[1];//entities.decode(match[1]);
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
