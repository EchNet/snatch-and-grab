// en_wikipedia_allpages.js

function recognize(body) {
  return body.indexOf("Portal_Contents_A–Z_index") > 0;
}

function process(body, callback) {
  var regex = /<a href="(.wiki.Special:AllPages.[a-zA-Z0-9][a-zA-Z0-9]?)" /g;
  for (;;) {
    var match = regex.exec(body);
    if (!match) {
      break;
    }
    callback.enqueue(match[1]);
  }
}

module.exports = {
  version: "0.1.0",
  recognize: recognize,
  process: process
};
