"use strict";
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var VSH_iCal_Helper = require("../vic_ical_helper");
chai.config.includeStack = true;

describe("QSH iCal Helper", function() {
  var subject = new VSH_iCal_Helper();
  describe("#Saturday", function() {
    context("from date()", function() {
      it("returns true", function() {
        var d = new Date("2018-02-03");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#Public Holiday", function() {
    context("from the Public Holiday Calendar", function() {
      it("returns true", function() {
        var d = new Date("2017-01-01");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#Holidays", function() {
    context("from the QLD School Holidays iCal", function() {
      it("April 1 returns true", function() {
        var d = new Date("2018-04-11");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("April 9 returns true", function() {
        var d = new Date("2018-04-09");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("July 3 returns true", function() {
        var d = new Date("2018-07-03");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#SchoolDays", function() {
    context("from the Victorian School Holidays iCal", function() {
      it("March 29 returns false", function() {
        var d = new Date("2018-03-29");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
      it("July 16 returns false", function() {
        let d = new Date("2018-07-16");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
    });
  });
  describe("#UntilHolidays", function() {
    context("from March 20 2018", function() {
      it("returns 10:8", function() {
        let d = new Date("2018-03-20");
        let r = {'totalDays' : 10, 'schoolDays' : 8};
        return expect(subject.nextHoliday(d)).to.eventually.deep.equal(r);
      });
    });
  });
});
