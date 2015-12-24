// en_wikipedia_allpages.js

function recognize(body) {
  return body.indexOf(" ns-special mw-special-Allpages ") > 0;
}

function enqueueAll(body, regex, callback) {
  var match;
  while (match = regex.exec(body)) {
    callback.enqueue(match[1]);
  }
}

function process(body, callback) {
  enqueueAll(body, /<li class=.allpagesredirect.><a href="(.wiki.[^"][^"]*)" /g, callback);
  enqueueAll(body, /<a href="(.w.index.php?title=Special:AllPages&amp;from=[^"])" /g, callback);
}

module.exports = {
  version: "0.1.0",
  recognize: recognize,
  process: process
};
