"use strict";
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var VSH_iCal_Helper = require("../vic_ical_helper");
chai.config.includeStack = true;

describe("VSH iCal Helper", function() {
  var subject = new VSH_iCal_Helper();
  describe("#Saturday", function() {
    context("from date()", function() {
      it("returns true", function() {
        var d = new Date("2020-02-01");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#Public Holiday", function() {
    context("from the Public Holiday Calendar", function() {
      it("returns true", function() {
        var d = new Date("2020-11-03");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#Holidays", function() {
    context("from the VIC School Holidays iCal", function() {
      it("April 8 returns true", function() {
        var d = new Date("2020-04-08");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("July 3 returns true", function() {
        var d = new Date("2020-07-03");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#SchoolDays", function() {
    context("from the Victorian School Holidays iCal", function() {
      it("March 18 returns false", function() {
        var d = new Date("2020-03-18");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
      it("July 16 returns false", function() {
        let d = new Date("2020-07-16");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
    });
  });
  describe("#UntilHolidays", function() {
    context("from March 13 2020", function() {
      it("returns 12:8", function() {
        let d = new Date("2020-03-13");
        let r = {'totalDays' : 12, 'schoolDays' : 8};
        return expect(subject.nextHoliday(d)).to.eventually.deep.equal(r);
      });
    });
  });
});
