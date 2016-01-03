// config.js

// Synchronous configuration based on input parameters.
// params.site           The site to crawl
// params.component      What component is running (e.g. scraper)
// params.env            Runtime environment (dev vs. prod)
//
module.exports = function(params) {

  var extend = require("extend");

  var defaults = {
    site: "en_wikipedia",
    component: "master",
    env: "dev"
  }

  // The eventual result.
  var config = extend(true, {}, defaults, params);

  var site = config.site;
  var component = config.component;
  var env = config.env;

  config.site = require("./" + site + ".js");

  config.request = (function() {
    return {
      request: {
        timeout: 15000
      }
    };
  })();

  config.crawlerQueue = (function() {
    return {
      prefix: "cq",
      concurrency: 5,
      redis: {
        host: "localhost",
        port: 6379,
        db: 1
      }
    };
  })();

  config.scraperQueue = (function() {
    return {
      prefix: "sc",
      concurrency: 5,
      redis: {
        host: "localhost",
        port: 6379,
        db: 1
      }
    };
  })();

  config.checklist = (function() {
    return {
      redis: {
        host: "localhost",
        port: 6379,
        db: 2
      }
    };
  })();

  config.database = (function() {
    return {
      mongo: {
        host: env == "dev" ? "localhost" : "db.whwh.fyi",
        port: 27017,
        database: "local",
        collection: site,
        controlCollection: "control"
      }
    };
  })();

  config.control = (function() {
    var second = 1000;
    var minute = second * 60;
    var hour = minute * 60;
    var day = hour * 24;
    return {
      quantum: minute,
      scrapesPerQuantum: env == "dev" ? 5 : 1000,
      scrapeFreshnessTime: env == "dev" ? minute : day
      crawlFreshnessTime: env == "dev" ? minute : (day * 2)
    };
  })();

  return config;
}
