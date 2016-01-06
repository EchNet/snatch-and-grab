/* crawler.js */

var version = "0.1.1.10";

var request = require("request");

var App = require("./app").App;

var app = new App("crawler");

app.open([ "crawlerQueue", "db" ], function(queue, db) {

  var host = app.config.site.host;
  var timeout = app.config.request.timeout;
  var crawlText = app.config.site.crawlText;

  function doRequest(uri, callback) {
    var url = host + uri;
    request({
      url: url,
      timeout: timeout,
      followRedirect: false
    }, callback);
  }

  function handleValidResponse(uri, text) {
    var updateTasks = [];
    crawlText(text, {
      crawl: function(hrefUri) {
        updateTasks.push(function(proceed) {
          queue.enqueue(hrefUri, proceed);
        });
      },
      recognize: function(hrefUri) {
        updateTasks.push(function(proceed) {
          db.collection.findOne({
            uri: hrefUri
          }, function(err, result) {
            if (result) {
              //console.log(hrefUri, "already counted");
              proceed();
            }
            else {
              console.log(hrefUri, "counted");
              db.collection.insertOne({
                uri: hrefUri,
                created_at: new Date(),
                crawler_version: version
              }, null, proceed);
            }
          });
        });
      }
    });
    return updateTasks;
  }

  function work(job, done) {
    var uri = job.data.uri;
    doRequest(uri, function(error, response, text) {
      if (error) {
        console.log("request error", uri, error);
        done();
      }
      else if (response.statusCode != 200) {
        console.log("bad HTTP status code", uri, response.statusCode);
        done();
      }
      else if (response.headers["content-type"] != "text/html; charset=UTF-8") {
        console.log("bad content type", uri, response.headers["content-type"]);
        done();
      }
      else {
        console.log("content received", uri);
        var updateTasks = handleValidResponse(uri, text);
        if (updateTasks.length == 0) {
          console.log("warning: apparent dead end", uri);
        }
        app.executeSequence(updateTasks, done);
      }
    });
  };

  function process() {
    queue.process(work);
  }

  function prime(cont) {
    queue.enqueue(app.config.site.origin);
  }

  function keepPrimed() {
    queue.ifEmpty(prime);
  }

  if (app.args.restart) {
    console.log("restarting");
    queue.clear(function() {
      prime();
      process();
    });
  }
  else {
    queue.restartJobs();
    process();
  }

  setInterval(keepPrimed, app.config.control.crawlInterval);
});
