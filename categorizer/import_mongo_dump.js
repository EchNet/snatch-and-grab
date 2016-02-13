/* import_mongo_dump.js */

var fs = require("fs");
var readline = require("readline");

var inFile = fs.createReadStream("data/en_wikipedia.export");
var outFile = fs.createWriteStream("data/en_wikipedia.data");

var count = 0;

function gotLine(line) {
  var record = JSON.parse(line);
  if (record.content && record.content.geo) {
    ++count;
    if (count % 10000 == 0) console.log(count);
    outFile.write(JSON.stringify({ uri: record.uri, tags: record.content.categories }) + "\n");
  }
}

inFile.on("error", function(error) {
  console.log(error);
  process.exit(1);
});

inFile.on("end", function() {
  console.log("end");
  inFile.close();
  outFile.close();
  process.exit(0);
});

readline.createInterface({
  input: inFile,
  terminal: false
}).on("line", gotLine);
