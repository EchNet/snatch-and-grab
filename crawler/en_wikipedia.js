// en_wikipedia.js

var geoformat = require("./geoformat");
var extend = require("extend");

var host = "https://en.wikipedia.org";

var originUri = "/wiki/Special:AllPages";

var nextLinkInContextRegex =
  /<a href="(\/w\/index\.php\?title\=Special\:AllPages\&amp;from=[^"]*)" title="Special\:AllPages">Next /g;

var articleLinkInContextRegex =
  /<li class=.allpagesredirect.><a href="(.wiki.[^"][^"]*)" /g;

function looksLikeIndexPage(text) {
  return text.indexOf(" ns-special mw-special-Allpages ") > 0;
}

function looksLikeArticlePage(text) {
  return text.indexOf(" ns-subject page") > 0;
}

function fixUri(uri) {
  return uri.replace(/\&amp\;/g, "&");
}

function crawlText(text, crawler) {
  var match;
  if (looksLikeIndexPage(text)) {
    if (match = nextLinkInContextRegex.exec(text)) {
      crawler.crawl(fixUri(match[1]));
    }
    while (match = articleLinkInContextRegex.exec(text)) {
      crawler.recognize(fixUri(match[1]));
    }
  }
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
