/* buildwww.js */

var fs = require("fs");

function copyFile(source, target, cb) {
  var cbCalled = false;

	function done(err) {
		if (!cbCalled) {
			cb(err);
			cbCalled = true;
		}
	}

	var rd = fs.createReadStream(source);
	rd.on("error", done);

	var wr = fs.createWriteStream(target);
	wr.on("error", done);

	wr.on("close", function(ex) {
		done();
	});

	rd.pipe(wr);
}

// Copy whwh.js into generated.
copyFile("www/partials/whwh.js", "www/generated/whwh.js", function(err) {
	if (err) throw err;

	// Copy index file into generated.
	copyFile("www/partials/index_en.html", "www/generated/index.html", function(err) {
		if (err) throw err;
		console.log("Done");
	});
});

