// phony_site.js

module.exports = {
  host: "http://scooterlabs.com",
  origin: "/echo?index_page=1",
  crawlText: function(text, crawler) {
    var m = /\[index_page\] => (\d+)/.exec(text);
    var count = m && parseInt(m[1]);
    if (count <= 10) {
      crawler.recognize("/echo?content_page=" + count);
    }
    if (count < 10) {
      crawler.crawl("/echo?index_page=" + (count + 1));
    }
  },
  scrapeText: function() {}
};
