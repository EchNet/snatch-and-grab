// geoformat.js

function parseValue(text) {
  var match;
  var value;
  if (/^[-]?[0-9]*(\.[0-9]*)?$/.exec(text)) {
    return parseFloat(text);
  }
  if (match = /^([0-9]*(\.[0-9]*)?)°([NnSsEeWw])$/.exec(text)) {
    value = parseFloat(match[1]);
    if ("sSwW".indexOf(match[3]) >= 0) {
      value *= -1;
    }
    return value;
  }
  if (match = /^([0-9]+)°([0-9]+)′([0-9]+)″([NnSsEeWw])$/.exec(text)) {
    var degrees = parseInt(match[1]);
    var minutes = parseInt(match[2]);
    var seconds = parseInt(match[3]);
    value = degrees + minutes/60.0 + seconds/3600.0;
    if ("sSwW".indexOf(match[4]) >= 0) {
      value *= -1;
    }
    return value;
  }
  return false;
}

function parseLatLong(text) {
  var match;
  if (match = /^([^; ]+)[; ]+([^; ]+)$/.exec(text)) {
    var coords = {};
    var lat = parseValue(match[1]);
    if (typeof lat == "number") {
      coords.latitude = lat;
    }
    var long = parseValue(match[2])
    if (typeof long == "number") {
      coords.longitude = long;
    }
    return coords;
  }
  return null;
}

module.exports = {
  parseValue: parseValue,
  parseLatLong: parseLatLong
};
