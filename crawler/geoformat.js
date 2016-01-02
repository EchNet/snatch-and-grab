// geoformat.js

function parseValue(text) {
  var match;
  var value;
  if (match = /^-?[0-9]+(\.[0-9]*)$/.exec(text)) {
    return { value: parseFloat(text), text: text };
  }
  if (match = /^([0-9]+(\.[0-9]*)?)°([NnSsEeWw])$/.exec(text)) {
    value = parseFloat(match[1]);
    if ("sSsW".indexOf(match[3]) >= 0) {
      value *= -1;
    }
    return { value: value, text: match[0] };
  }
  if (match = /^([0-9]+)°([0-9]+)′([0-9]+)″([NnSsEeWw])$/.exec(text)) {
    var degrees = parseInt(match[1]);
    var minutes = parseInt(match[2]);
    var seconds = parseInt(match[3]);
    value = degrees + minutes/60.0 + seconds/3600.0;
    if ("sSsW".indexOf(match[4]) >= 0) {
      value *= -1;
    }
    return { value: value, text: match[0] };
  }
  return false;
}

function parseLatLong(text) {
  var match;
  if (match = /^([^; ]+);? ([^; ]+)$/.exec(text)) {
    var coords = {};
    var lat = parseValue(match[1]);
    if (!!lat) {
      coords.latitude = lat.value;
      coords.latitude_text = lat.text;
    }
    var long = parseValue(match[2])
    if (!!long) {
      coords.longitude = long.value;
      coords.longitude_text = long.text;
    }
    return coords;
  }
  return null;
}

module.exports = {
  parseValue: parseValue,
  parseLatLong: parseLatLong
};
