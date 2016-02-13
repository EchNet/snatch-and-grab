/* categorizer.js */

var fs = require("fs");
var express = require("express");
var extend = require("extend");
var readline = require("readline");

var site = "en_wikipedia";
var categoriesFileName = "data/" + site + "_categories.json";
var ambigFileName = "data/" + site + "_ambig.json";
var recordsFileName = "data/" + site + "_records.json";

var categories = [
  {
    id: 0,
    name: "regions"
    tags: []
  },{
    id: 1,
    name: "points of interest"
    tags: []
  },{
    id: 2,
    name: "neighborhoods"
    tags: []
  },{
    id: 3,
    name: "events",
    tags: []
  }
];
var ambig = {};
var records = [];
var categorized = 0;
var uncategorized = 0;

function exit(status) {
  setTimeout(function() {
    process.exit(status);
  }, 1000);
}

function goodbye() {
  exit(0);
}

function bomb(err) {
  console.log("ERROR", err);
  exit(1);
}

function loadCategories(next) {
  console.log("loading categories...");
  fs.readFile(categoriesFileName, "utf8", function(err, data) {
    if (!err && data) {
      categories = JSON.parse(data);
    }
    next();
  });
}

function loadAmbig(next) {
  console.log("loading ambiguous tags...");
  fs.readFile(ambigFileName, "utf8", function(err, data) {
    if (!err && data) {
      ambig = JSON.parse(data);
    }
    next();
  });
}

function loadRecords(next) {
  console.log("loading records...");

  var inFile = fs.createReadStream("data/en_wikipedia.data");
  inFile.on("error", function(error) {
    bomb(error);
  });

  inFile.on("end", function() {
    console.log("loaded");
    inFile.close();
    next();
  });

  var count = 0;

  readline.createInterface({
    input: inFile,
    terminal: false
  }).on("line", function (line) {
    var record = JSON.parse(line);
    records.push(record);
    if (++count % 100000 == 0) {
      console.log(count + "...");
    }
  });
}

function categorizeRecord(record) {
  var tags = record.tags;
  delete record.ctg;
  delete record.hard;
  for (var j = 0; j < categories.length; ++j) {
    var category = categories[j];
    for (var i = 0; i < tags.length; ++i) {
      var tag = tags[i];
      if (category.tags[tag]) {
        record.ctg = category.id;
        return;
      }
    }
  }
}

function updateCounts() {
  categorized = 0;
  uncategorized = 0;
  for (var i = 0; i < records.length; ++i) {
    var record = records[i];
    if (record.ctg == null) {
      ++uncategorized;
    }
    else {
      ++categorized;
    }
  }
}

function categorizeAll() {
  console.log("categorizing...");
  for (var i = 0; i < records.length; ++i) {
    var record = records[i];
    if (record.ctg == null || !record.hard) {
      categorizeRecord(record);
    }
  }
  updateCounts();
  console.log("categorized:", categorized, "uncategorized:", uncategorized);
}

function hardCategorize(record, category) {
  record.ctg = category.id;
  record.hard = true;
  var tags = record.tags;
  for (var i = 0; i < tags.length; ++i) {
    var tag = tags[i];
    if (!category.tags[tag] && !ambiguizeTag(tag)) {
      category.tags[tag] = 1;
    }
  }
}

function countCategories() {
  var count = 0;
  for (var i in categories) {
    ++count;
  }
  return count;
}

function getCategory(cname) {
  if (typeof cname == "number") {
    return categories[cname];
  }
  else {
    var newCategory = {
      name: cname,
      id: categories.length,
      tags: {}
    };
    categories.push(newCategory);
    return newCategory;
  }
}

function findUriToClassify() {
  for (var i = 0; i < records.length; ++i) {
    var record = records[i];
    if (record.ctg == null) {
      return record.uri;
    }
  }
}

function getState() {
  return {
    categorized: categorized,
    uncategorized: uncategorized,
    uri: findUriToClassify(),
    categories: categories.map(function(item) {
      return {
        name: item.name,
        id: item.id,
        tags: (function() {
          var count = 0;
          for (var i in item.tags) {
            ++count;
          }
          return count;
        })();
      };
    })
  };
}

function startServer() {
  console.log("starting server...");
  var server = express();
  server.use(express.static("www"));

  server.get("/cat", function(req, res) {
    if (req.query.rn) {
      var rn = parseInt(req.query.rn);
      if (isNan(rn) || rn < 0 || rn >= records.length) {
        res.json({ status: "ERROR", msg: "invalid rn" });
      }
      else {
        hardCategorize(records[recordNumber], getCategory(req.query.c));
        categorizeAll();
      }
    }
    res.json(getState());
  });

  server.get("/save", function(req, res) {
    doSave(function() {
      res.json({ status: "OK" });
    });
  });

  server.listen(3400, function () {
    console.log("categorizer listening");
  });
}

function executeSequence(steps, andThen) {
  (function next() {
    var f = steps.shift();
    f ? f(next) : andThen();
  })();
}

executeSequence([
  loadCategories,
  loadAmbig,
  loadRecords,
  function(next) { categorizeAll(); next(); }
], startServer);
