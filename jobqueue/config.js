// config.js

var en_wikipedia = {
  type: "en",
  site: {
    host: "https://en.wikipedia.org",
    origin: "/wiki/Special:AllPages"
  },
  worker: {
    concurrency: 30,
    timeout: 15000,
    freshnessTime: 82400000,
    path: [
      "wikipedia_article",
      "wikipedia_allpages"
    ]
  },
  queue: {
    prefix: "q",
    redis: {
      host: "localhost",
      port: 6379,
      db: 2
    }
  },
  database: {
    redis: {
      host: "localhost",
      port: 6379,
      db: 1
    }
  }
};

module.exports = {
  default: en_wikipedia,
  en_wikipedia: en_wikipedia
};
