// en_wikipedia.js

var geoformat = require("./geoformat");
var extend = require("extend");

var host = "https://en.wikipedia.org";

var originUri = "/wiki/Special:AllPages";

function looksLikeArticlePage(text) {
  return text.indexOf(" ns-subject page") > 0;
}

function fixUri(uri) {
  return uri.replace(/\&amp\;/g, "&");
}

function crawlForNextLink(text, crawler) {
  var nextLinkInContextRegex =
    /<a href="(\/w\/index\.php\?title\=Special\:AllPages\&amp;from=[^"]*)" title="Special\:AllPages">Next /;
  var match;
  if (match = nextLinkInContextRegex.exec(text)) {
    crawler.crawl(fixUri(match[1]));
  }
  else {
    console.log("no next page... is this the end?");
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

function crawlText(text, crawler) {
  crawlForNextLink(text, crawler);
  crawlForArticleLinks(text, crawler);
}

function scrapeText(text) {
  var scrapage = null;
  if (looksLikeArticlePage(text)) {
    scrapage = {};
    var match;
    if (match = /<span class="latitude">([0-9][^<]*)</.exec(text)) {
      scrapage = extend(true, scrapage, { geo: { latitude: geoformat.parseValue(match[1]), g0: 1 } });
    }
    if (match = /<span class="longitude">([0-9][^<]*)</.exec(text)) {
      scrapage = extend(true, scrapage, { geo: { longitude: geoformat.parseValue(match[1]), g1: 1 } });
    }
    if (match = /<span class="geo-dec"[^>]*>([-0-9][^<]*)</.exec(text)) {
      var geo = geoformat.parseLatLong(match[1]);
      if (geo) {
        scrapage = extend(true, scrapage, { geo: geo }, { geo: { g2: 1 } });
      }
    }
    if (match = /<span class="geo"[^>]*>([-0-9][^<]*)</.exec(text)) {
      var geo = geoformat.parseLatLong(match[1]);
      if (geo) {
        scrapage = extend(true, scrapage, { geo: geo }, { geo: { g3: 1 } });
      }
    }
  }
  return scrapage;
}

module.exports = {
  host: host,
  origin: originUri,
  crawlText: crawlText,
  scrapeText: scrapeText
};
