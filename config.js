// config.js

// Synchronous configuration based on input parameters.
// params.site           The site to crawl
// params.component      What component is running (e.g. scraper)
// params.env            Runtime environment (dev vs. prod)
//
module.exports = function(params) {

  var extend = require("extend");

  function getEnv(key, dflt) {
    var val = process.env["WHWH_" + key];
    return val || dflt;
  }

  params = extend({
    site: "en_wikipedia",
    component: "server",
    env: getEnv("ENV", "dev")
  }, params);

  var site = params.site;
  var component = params.component;
  var env = params.env;

  return {
    params: params,

    site: require("./" + site + ".js"),

    web: (function() {
      return {
        port: env == "dev" ? 3300 : 80
      }
    })(),

    request: (function() {
      return {
        request: {
          timeout: 5000
        }
      }; })(),

    crawlerQueue: (function() {
      return {
        prefix: "cq",
        concurrency: 5,
        redis: {
          host: "localhost",
          port: 6379,
          db: 1
        }
      };
    })(),

    scraperQueue: (function() {
      return {
        prefix: "sc",
        concurrency: env == "dev" ? 3 : 10,
        redis: {
          host: "localhost",
          port: 6379,
          db: 2
        }
      };
    })(),

    checklist: (function() {
      return {
        redis: {
          host: "localhost",
          port: 6379,
          db: 3
        }
      };
    })(),

    database: (function() {
      return extend(true, {}, {
        mongo: {
          collection: site
        }
      }, (env == "dev") ? {
        mongo: {
          host: "localhost",
          port: 27017,
          database: "local"
        }
      } : {
        mongo: {
          host: "c462.candidate.62.mongolayer.com",
          port: 10462,
          database: "whwh",
          user: getEnv("MONGO_USER"),
          password: getEnv("MONGO_PASSWORD")
        }
      });
    })(),

    elasticsearch: (function() {
      return {
        host: "localhost:9200",
        log: {
          level: "trace",
          type: "file",
          path: "logs/elasticsearch.log"
        }
      };
    })(),

    control: (function() {
      var second = 1000;
      var minute = second * 60;
      var hour = minute * 60;
      var day = hour * 24;
      var week = day * 7;
      return {
        quantum: env == "dev" ? (second * 20) : minute,
        recrawlInterval: (env == "dev" ? minute : hour) * 8,
        crawlReaperInterval: env == "dev" ? minute : hour,
        scrapeFreshnessTime: env == "dev" ? day : week
      };
    })()
  };
}
