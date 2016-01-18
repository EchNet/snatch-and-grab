// config.js

// Synchronous configuration based on input parameters.
// params.site           The site to crawl
// params.component      What component is running (e.g. scraper)
// params.env            Runtime environment (dev vs. prod)
//
module.exports = function(params) {

  var extend = require("extend");

  params = extend({
    site: "en_wikipedia",
    component: "master",
    env: "dev"
  }, params);

  var site = params.site;
  var component = params.component;
  var env = params.env;

  return {
    params: params,

    site: require("./" + site + ".js"),

    web: {
      port: 3300
    },

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
        concurrency: 3,
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
      return {
        mongo: {
          host: env == "dev" ? "localhost" : "db.whwh.fyi",
          port: 27017,
          database: "local",
          collection: site
        }
      };
    })(),

    elasticsearch: (function() {
      return {
        host: "localhost:9200",
        log: {
          level: "trace",
          type: "file",
          path: "../logs/elasticsearch.log"
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
        quantum: minute,
        scrapesPerQuantum: env == "dev" ? 500 : 5000,
        scrapeFreshnessTime: env == "dev" ? day : week
      };
    })()
  };
}
