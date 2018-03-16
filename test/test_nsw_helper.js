"use strict";
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var NSW_iCal_Helper = require("../NSW_ical_helper");
chai.config.includeStack = true;

describe("NSW iCal Helper", function() {
  var subject = new NSW_iCal_Helper("western");
  describe("#Saturday", function() {
    context("from date()", function() {
      it("returns true", function() {
        var d = new Date("2018-02-03");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#Public Holiday", function() {
    context("from the Google Public Holiday Calendar", function() {
      it("returns true", function() {
        var d = new Date("2017-01-01");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#Holidays", function() {
    context("from the NSW School Holidays iCal", function() {
      it("January 29 returns true", function() {
        var d = new Date("2018-01-29");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("April 16 returns true", function() {
        var d = new Date("2018-04-16");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("July 10 returns true", function() {
        var d = new Date("2018-07-10");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#SchoolDays", function() {
    context("from the NSW School Holidays iCal", function() {
      it("March 29 returns false", function() {
        var d = new Date("2018-03-29");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
      it("July 24 returns false", function() {
        var d = new Date("2018-07-24");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
    });
  });
  describe("#UntilHolidays", function() {
    context("from July 2 2018", function() {
      it("returns 6", function() {
        var d = new Date("2018-07-02");
        return expect(subject.nextHoliday(d)).to.eventually.equal(6);
      });
    });
  });
});
