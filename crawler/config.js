// config.js

function looksLikeIndexPage(text) {
  return text.indexOf(" ns-special mw-special-Allpages ") > 0;
}

function findOne(text, regex, callback) {
  var match;
  if (match = regex.exec(text)) {
    callback(match[1].replace(/\&amp\;/g, "&"));
  }
}

function findAll(text, regex, callback) {
  var match;
  while (match = regex.exec(text)) {
    callback(match[1].replace(/\&amp\;/g, "&"));
  }
}

var en_wikipedia = {
  type: "en",
  site: {
    host: "https://en.wikipedia.org",
    origin: "/wiki/Special:AllPages",
    forEachLink: function(text, callback) {
      if (looksLikeIndexPage(text)) {
        findOne(text, /<a href="(\/w\/index\.php\?title\=Special\:AllPages\&amp;from=[^"]*)" title="Special\:AllPages">Next /g, callback);
      }
    },
    forEachLeaf: function(text, callback) {
      if (looksLikeIndexPage(text)) {
        findAll(text, /<li class=.allpagesredirect.><a href="(.wiki.[^"][^"]*)" /g, callback);
      }
    },
    versionHeaders: { "last-modified": 1 }
  },
  worker: {
    concurrency: 5,
    timeout: 15000,
    freshnessTime: 1000 * 60 * 60 * 24 * 4
  },
  queue: {
    prefix: "q",
    redis: {
      host: "localhost",
      port: 6379,
      db: 1
    }
  },
  checklist: {
    redis: {
      host: "localhost",
      port: 6379,
      db: 3
    }
  },
  database: {
    mongo: {
      host: "localhost",
      port: 27017,
      database: "local",
      collection: "en_wikipedia"
    }
  }
};

module.exports = {
  default: en_wikipedia,
  en_wikipedia: en_wikipedia
};
