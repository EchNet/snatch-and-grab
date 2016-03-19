var expect = require("chai").expect;
var geoformat = require("../geoformat");

describe("Geo Parser", function() {
  describe("Single value parser", function() {
    it("parses non-negative integer values", function() {
      expect(geoformat.parseValue("0")).to.equal(0);
      expect(geoformat.parseValue("1")).to.equal(1);
      expect(geoformat.parseValue("149")).to.equal(149);
    });
    it("parses negative integer values", function() {
      expect(geoformat.parseValue("-1")).to.equal(-1);
      expect(geoformat.parseValue("-149")).to.equal(-149);
    });
    it("parses non-negative decimal values", function() {
      expect(geoformat.parseValue("1.5")).to.equal(1.5);
      expect(geoformat.parseValue("149.75")).to.equal(149.75);
    });
    it("parses negative decimal values", function() {
      expect(geoformat.parseValue("-.5")).to.equal(-0.5);
      expect(geoformat.parseValue("-1.5")).to.equal(-1.5);
      expect(geoformat.parseValue("-149.75")).to.equal(-149.75);
    });
    it("parses decimal degrees north", function() {
      expect(geoformat.parseValue("33.5°N")).to.equal(33.5);
      expect(geoformat.parseValue("33.5°n")).to.equal(33.5);
    });
    it("parses decimal degrees south", function() {
      expect(geoformat.parseValue("73.2°S")).to.equal(-73.2);
      expect(geoformat.parseValue("73.2°s")).to.equal(-73.2);
    });
    it("parses decimal degrees east", function() {
      expect(geoformat.parseValue("33.5°E")).to.equal(33.5);
      expect(geoformat.parseValue("33.5°e")).to.equal(33.5);
    });
    it("parses decimal degrees west", function() {
      expect(geoformat.parseValue("73.2°W")).to.equal(-73.2);
      expect(geoformat.parseValue("73.2°w")).to.equal(-73.2);
    });
    it("parses DMS north", function() {
      expect(geoformat.parseValue("04°0′0″N")).to.equal(4);
      expect(geoformat.parseValue("04°0′0″n")).to.equal(4);
    });
  });
  describe("lat/long parser", function() {
    it("parses double integer strings", function() {
      expect(geoformat.parseLatLong("5 66")).to.deep.equal({
        latitude: 5, longitude: 66
      });
    });
    it("parses geo-dec strings", function() {
      expect(geoformat.parseLatLong("50.85°N 4.35°E")).to.deep.equal({
        latitude: 50.85, longitude: 4.35
      });
    });
  });
});
