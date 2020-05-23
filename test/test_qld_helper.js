"use strict";
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var QSH_iCal_Helper = require("../qld_ical_helper");
chai.config.includeStack = true;

describe("QSH iCal Helper", function() {
  var subject = new QSH_iCal_Helper();
  describe("#Saturday", function() {
    context("from date()", function() {
      it("returns true", function() {
        var d = new Date("2020-02-01");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#Public Holiday", function() {
    context("from the Google Public Holiday Calendar", function() {
      it("returns true", function() {
        var d = new Date("2020-01-01");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#Holidays", function() {
    context("from the QLD School Holidays iCal", function() {
      it("April 6 returns true", function() {
        var d = new Date("2020-04-06");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("April 9 returns true", function() {
        var d = new Date("2020-04-09");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("July 3 returns true", function() {
        var d = new Date("2020-07-03");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#SchoolDays", function() {
    context("from the QLD School Holidays iCal", function() {
      it("March 27 returns false", function() {
        var d = new Date("2020-03-27");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
      it("July 16 returns false", function() {
        let d = new Date("2020-07-16");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
    });
  });
  describe("#UntilHolidays", function() {
    context("from March 20 2020", function() {
      it("returns 16:11", function() {
        let d = new Date("2020-03-20");
        let r = {'totalDays' : 16, 'schoolDays' : 11};
        return expect(subject.nextHoliday(d)).to.eventually.deep.equal(r);
      });
    });
  });
  describe("#UntilHolidays", function() {
    context("from April 21 2020", function() {
      it("returns 68:48", function() {
        let d = new Date("2020-04-21");
        let r = {'totalDays' : 68, 'schoolDays' : 48};
        return expect(subject.nextHoliday(d)).to.eventually.deep.equal(r);
      });
    });
  });
});
