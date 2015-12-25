// en_wikipedia_allpages.js

function recognize(body) {
  return body.indexOf(" ns-special mw-special-Allpages ") > 0;
}

function enqueueOne(body, regex, callback) {
  var match;
  if (match = regex.exec(body)) {
    callback.enqueue(match[1].replace(/\&amp\;/g, "&"));
  }
}

function enqueueAll(body, regex, callback) {
  var match;
  while (match = regex.exec(body)) {
    callback.enqueue(match[1].replace(/\&amp\;/g, "&"));
  }
}

function process(body, callback) {
  enqueueOne(body, /<a href="(\/w\/index\.php\?title\=Special\:AllPages\&amp;from=[^"]*)" title="Special\:AllPages">Next /g, callback);
  enqueueAll(body, /<li class=.allpagesredirect.><a href="(.wiki.[^"][^"]*)" /g, callback);
}

module.exports = {
  version: "wikipedia allpages 0.1",
  recognize: recognize,
  process: process
};
