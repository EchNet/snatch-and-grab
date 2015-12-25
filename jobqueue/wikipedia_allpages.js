// en_wikipedia_allpages.js

function recognize(body) {
  return body.indexOf(" ns-special mw-special-Allpages ") > 0;
}

function enqueueAll(body, regex, callback) {
  var match;
  while (match = regex.exec(body)) {
    callback.enqueue(match[1].replace(/\&amp\;/g, "&"));
  }
}

function process(body, callback) {
  console.log("here we are");
  enqueueAll(body, /<a href="(\/w\/index\.php\?title\=Special\:AllPages\&amp;from=[^"]*)" /g, callback);
  //enqueueAll(body, /<li class=.allpagesredirect.><a href="(.wiki.[^"][^"]*)" /g, callback);
}

module.exports = {
  version: "wikipedia allpages 0.1",
  recognize: recognize,
  process: process
};
