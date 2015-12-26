// config.js

function findBody(dom) {
  if (dom.nodeName == "body") {
    return dom;
  }
  else {
    for (var child = dom.firstChild; child != null; child = child.nextSibling) {
      if (child.nodeType == 1) {
        var body = findBody(child);
        if (body) return body;
      }
    }
  }
  return null;
}

var en_wikipedia = {
  type: "en",
  site: {
    host: "https://en.wikipedia.org",
    origin: "/wiki/Special:AllPages",
    followLink: function(ele) {
      if (ele.getAttribute("title") == "Special:AllPages") {
        if (ele.getAttribute("href").match(/^\/w\/index\.php\?title\=Special\:AllPages\&amp;from=[^"]*$/)) {
          return true;
        }
      }
      else if (ele.getAttribute("href").match(/\/wiki\/[^:"]*$/)) {
        if (ele.parentNode.getAttribute("class") == "allpagesredirect") {
          return true;
        }
      }
      return false;
    },
    cleanUri: function(uri) {
      return uri.replace(/[?&]printable=yes/g, "");
    },
    recognize: function(dom) {
      var body = findBody(dom.documentElement);
      var classes = body.getAttribute("class");
      return classes && classes.match(/\bns-subject\b/) && classes.match(/\bpage\b/);
    },
    versionHeaders: { "last-modified": 1 }
  },
  worker: {
    concurrency: 30,
    timeout: 15000,
    freshnessTime: 1000 * 60 * 60 * 24 * 4
  },
  queue: {
    prefix: "q",
    redis: {
      host: "localhost",
      port: 6379,
      db: 2
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
