(function(g, $) {

  function getLocation(callback) {
    var geolocation = g.navigator.geolocation;
    if (!geolocation) {
      return false;
    }
    geolocation.getCurrentPosition(function(position) {
      callback(null, [ position.coords.longitude, position.coords.latitude ]);
    }, function(error) {
      callback(error);
    });
    return true;
  }

  function printLocation(geoloc) {
    return geoloc[1] + "," + geoloc[0];
  }

  function queryLocation(geoloc) {
    return $.ajax({
      method: "GET",
      url: "/whwh",
      data: { lat: geoloc[1], long: geoloc[0] },
      dataType: "json"
    });
  }

  function renderResults(results, $container) {
    if (results) {
      for (var i = 0; i < results.length; ++i) {
        var result = results[i];
        $container
          .append($("<p>")
            .attr("class", "result")
            .append($("<a>")
              .attr("href", result.url)
              .text(result.title))
            .append($("<span>")
              .text(" at " + printLocation(result.loc)))
            .append($("<span>")
              .text(", distance " + result.d + " meter" + (result.d == 1 ? "" : "s"))));
      }
    }
  }

  g.whwh = {
    getLocation: getLocation,
    printLocation: printLocation,
    queryLocation: queryLocation,
    renderResults: renderResults
  };

})(window, jQuery);
