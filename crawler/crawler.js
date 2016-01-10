/* crawler.js */

var request = require("request");

var App = require("./app").App;

var app = new App("crawler");

app.open([ "crawlerQueue", "db" ], function(queue, db) {

  var host = app.config.site.host;
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
      else if (result.result.nModified == 0) {
        console.log("added", uri);
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
          queue.enqueue(hrefUri, proceed);
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
