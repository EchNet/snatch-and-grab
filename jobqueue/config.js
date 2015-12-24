// config.js

var en_wikipedia = {
  type: "en",
  site: {
    host: "https://en.wikipedia.org",
    origin: "/wiki/Special:AllPages"
  },
  worker: {
    concurrency: 30,
    path: [
      "en_wikipedia_article",
      "en_wikipedia_allpages"
    ]
  },
  queue: {
    prefix: "q",
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
