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
    var data = { lat: geoloc[1], long: geoloc[0] };
    var hash = g.location.hash;
    if (hash) {
      hash = hash.substring(1);
      if (hash && hash.length) {
        data.hash = hash;
      }
    }
    return $.ajax({
      method: "GET",
      url: "/whwh",
      data: data,
      dataType: "json"
    });
  }

  function renderOne(result, $container) {
    $container
      .append($("<div>")
        .attr("class", "result")
        .append($("<a>")
          .attr("class", "result")
          .attr("href", result.url)
          .attr("target", "_new")
          .text(result.title))
        .append($("<span>")
          .css("display", "none")
          .text(" at " + printLocation(result.loc)))
        .append($("<span>")
          .attr("class", "result")
          .text(", distance " + result.d + " meter" + (result.d == 1 ? "" : "s"))));
  }

  function renderFlatResults(results, $container) {
    for (var i = 0; i < results.length; ++i) {
      renderOne(results[i], $container);
    }
  }

  function renderTieredResults(results, $container) {
    var tiers = [ 80, 1000, 3000 ];
    var i = 0;
    var t = 0;
    var totalCount = 0;

    function heading() {
      if (t == 1 && totalCount) {
        return "We also have, a short distance away...";
      }
      else if (t == 1) {
        return "... but we do have, a short distance away...";
      }
      else if (t == 2 && totalCount) {
        return "... and you might wish to walk to these places...";
      }
      else if (t == 2) {
        return "... but you might wish to walk to these places...";
      }
      else {
        return "What we have right here...";
      }
    }

    for (; t < tiers.length; ++t) {
      var trDiv = $("<div>").attr("class", "tier-results");
      var count = 0;
      while (i < results.length && results[i].d <= tiers[t]) {
        renderOne(results[i], trDiv);
        ++i;
        ++count;
      }

      var tDiv = $("<div>").attr("class", "tier");
      if (count == 0) {
        if (t == 0) {
          tDiv.append($("<div>")
            .attr("class", "tier-heading")
            .append($("<span>")
              .attr("class", "tier-heading")
              .text("Sorry, there's nothing right here.")));
        }
      }
      else {
        tDiv.append($("<div>")
          .attr("class", "tier-heading")
          .append($("<span>")
            .attr("class", "tier-heading")
            .text(heading())));
        tDiv.append(trDiv);
      }
      $container.append(tDiv);
      totalCount += count;
    }
  }

  g.whwh = {
    getLocation: getLocation,
    printLocation: printLocation,
    queryLocation: queryLocation,
    renderFlatResults: renderFlatResults,
    renderTieredResults: renderTieredResults
  };

})(window, jQuery);
