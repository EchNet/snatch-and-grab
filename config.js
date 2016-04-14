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
    component: "server",
    env: getEnv("ENV", "dev")
  }, params);

  var site = params.site;
  var component = params.component;
  var env = params.env;

  var second = 1000;
  var minute = second * 60;

  return {
    params: params,

    site: site && require("./pipeline/" + site + ".js"),

    system: (function() {
      return {
        location: env == "prod" ? "s3://whwh" : ".",
        fileName: "config/system.json",
        freshness: 5 * minute 
      };
    })(),

    web: {
      port: 3300
    },

    request: {
      timeout: env == "prod" ? 5000 : 1000,
      retries: env == "prod" ? 10 : 3
    },

    scraperQueue: {
      concurrency: env == "dev" ? 3 : 10
    },

    elasticsearch: (function() {
      function formProdEsUrl(host) {
        var user = getEnv("ES_USER");
        var password = getEnv("ES_PASSWORD");
        return "https://" + user + ":" + password + "@" + host;
      }

      return extend(true, {}, {
        log: {
          level: "trace",
          type: "file",
          path: "logs/elasticsearch.log"
        }
      }, (env == "dev") ? {
        host: "localhost:9200",
      } : {
        hosts: [
          formProdEsUrl("aws-us-east-1-portal7.dblayer.com:10582"),
          formProdEsUrl("aws-us-east-1-portal10.dblayer.com:10236")
        ]
      });
    })()
  };
}
