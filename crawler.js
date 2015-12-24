/* crawler.js */

var request = require("request");

var App = require("./app").App;

var app = new App("crawler");

app.open([ "crawlerQueue", "db" ], function(queue, db) {

  var host = app.config.site.host;
  var originUri = app.config.site.origin;
  var timeout = app.config.request.timeout;
  var crawlText = app.config.site.crawlText;

  // Issue a Web page request.
  function doRequest(uri, callback) {
    var url = host + uri;
    request({
      url: url,
      timeout: timeout,
      followRedirect: false
    }, callback);
  }

  // Insert document for given URI, if one doesn't already exist.
  function upsert(uri, proceed) {
    db.collection.update({
      uri: uri
    }, {
      "$setOnInsert": { 
        uri: uri,
        created_at: new Date()
      }
    }, {
      upsert: true
    }, function(err, result) {
      if (err) {
        app.abort("database down?", err);
      }
      else if (result.result.upserted) {
        console.log(uri, "upserted");
      }
      proceed();
    });
  }

  // Handle Web page response.
  function handleValidResponse(uri, text) {
    var updateTasks = [];
    crawlText(text, {
      crawl: function(hrefUri) {
        updateTasks.push(function(proceed) {
          if (!app.args.cripple) {
            queue.enqueue(hrefUri, proceed);
          }
          else {
            proceed();
          }
        });
      },
      recognize: function(hrefUri) {
        updateTasks.push(function(proceed) {
          upsert(hrefUri, proceed);
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

  function keepCrawling() {
    queue.ifEmpty(function() {
      queue.enqueue(originUri);
    });
  }

  function reap() {
    queue.ifEmpty(function() {
      app.exit(0);
    });
  }

  if (app.args.restart) {
    (function() {
      var restartUri = (typeof app.args.restart == "string") ? app.args.restart : originUri;
      console.log("restarting from", restartUri);
      queue.clear(function() { queue.enqueue(restartUri, process); });
    })();
  }
  else {
    // Continue any jobs that were left by the previous run.
    queue.restartJobs(process);
  }

  if (app.args.repeat) {
    // Start up new crawls at regular intervals.
    setInterval(keepCrawling, app.config.control.recrawlInterval);
  }
  else {
    // Reap a dead crawl process.
    setInterval(reap, app.config.control.crawlReaperInterval);
  }

});
