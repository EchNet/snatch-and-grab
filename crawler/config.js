// config.js

var extend = require("extend");

function configure(params, callback) {

  var site = params.site || "en_wikipedia";
  var component = params.component || "master";
  var env = params.env || "dev";

  function generalConfig() {
    return {
      site: require("./" + site + ".js"),
      crawlerQueue: (function() {
        return {
          prefix: "cq",
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
          redis: {
            host: "localhost",
            port: 6379,
            db: 1
          }
        };
      })(),
      checklist: (function() {
        return {
          redis: {
            host: "localhost",
            port: 6379,
            db: 2
          }
        };
      })(),
      database: (function() {
        return {
          mongo: {
            host: "localhost",
            port: 27017,
            database: "local",
            collection: site
          }
        };
      })()
    };
  }

  function componentConfig() {
    var conf = {};
    if (component == "crawler") {
      conf.worker = {
        concurrency: 5,
        timeout: 15000
      };
    }
    else if (component == "scraper") {
      conf.scraper = {
        concurrency: 5,
        timeout: 15000,
        freshnessTime: 1000 * 60 * 60 * 24 * 4
      }
    }
    return conf;
  }

  return extend(true, generalConfig(), componentConfig(), params);
}

module.exports = configure;
