// en_wikipedia_article.js

function recognize(body) {
  return body.indexOf(" ns-subject page") > 0;
}

function parseLatLongDegrees(latLong) {
  return latLong;
}

function parseLatLongDec(latLong) {
  return { latitude: latLong, longitude: latLong };
}

function parseLatLongPlain(latLong) {
  return { latitude: latLong, longitude: latLong };
}

function process(body, callback) {
  var match;
  if (match = /<span class="latitude">([0-9][^<]*)</.exec(body)) {
    callback.scrape({ geo0: { latitude: parseLatLongDegrees(match[1]) } });
  }
  if (match = /<span class="longitude">([0-9][^<]*)</.exec(body)) {
    callback.scrape({ geo1: { longitude: parseLatLongDegrees(match[1]) } });
  }
  if (match = /<span class="geo-dec"[^>]*>([0-9][^<])</.exec(body)) {
    callback.scrape({ geo2: parseLatLongDec(match[1]) });
  }
  if (match = /<span class="geo"[^>]*>([0-9][^<])</.exec(body)) {
    callback.scrape({ geo3: parseLatLongPlain(match[1]) });
  }
}

module.exports = {
  recognize: recognize,
  process: process
};
