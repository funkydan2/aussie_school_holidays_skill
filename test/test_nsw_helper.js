"use strict";
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var NSW_iCal_Helper = require("../nsw_ical_helper");
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
      it("January 24 returns true", function() {
        var d = new Date("2020-01-24");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("April 16 returns true", function() {
        var d = new Date("2020-04-16");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("July 10 returns true", function() {
        var d = new Date("2020-07-10");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#SchoolDays", function() {
    context("from the NSW School Holidays iCal", function() {
      it("March 29 returns false", function() {
        var d = new Date("2020-03-27");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
      it("July 24 returns false", function() {
        var d = new Date("2020-07-24");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
    });
  });
  describe("#UntilHolidays", function() {
    context("from June 29 2020", function() {
      it("returns 6:5", function() {
        var d = new Date("2020-06-29");
        let r = { totalDays: 6, schoolDays: 5 };
        return expect(subject.nextHoliday(d)).to.eventually.deep.equal(r);
      });
    });
    context("from March 31 2020", function() {
      it("returns 11:8", function() {
        var d = new Date("2020-03-31");
        let r = { totalDays: 11, schoolDays: 8 };
        return expect(subject.nextHoliday(d)).to.eventually.deep.equal(r);
      });
    });
  });
});
