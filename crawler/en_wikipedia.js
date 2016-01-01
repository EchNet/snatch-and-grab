// en_wikipedia.js

var host = "https://en.wikipedia.org";

var originUri = "/wiki/Special:AllPages";

var nextLinkInContextRegex =
  /<a href="(\/w\/index\.php\?title\=Special\:AllPages\&amp;from=[^"]*)" title="Special\:AllPages">Next /g;

var articleLinkInContextRegex =
  /<li class=.allpagesredirect.><a href="(.wiki.[^"][^"]*)" /g;

var versionHeaders = { "last-modified": 1 };

function looksLikeIndexPage(text) {
  return text.indexOf(" ns-special mw-special-Allpages ") > 0;
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

module.exports = {
  host: host,
  origin: originUri,
  versionHeaders: versionHeaders,
  crawlText: crawlText
};
