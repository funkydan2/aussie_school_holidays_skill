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
      it("April 6 22 returns true", function() {
        var d = new Date("2022-04-06");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("April 14 returns true", function() {
        var d = new Date("2022-04-14");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
      it("July 5 returns true", function() {
        var d = new Date("2022-07-05");
        return expect(subject.isHoliday(d)).to.eventually.equal(true);
      });
    });
  });
  describe("#SchoolDays", function() {
    context("from the QLD School Holidays iCal", function() {
      it("March 25 returns false", function() {
        var d = new Date("2022-03-25");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
      it("July 12 returns false", function() {
        let d = new Date("2022-07-12");
        return expect(subject.isHoliday(d)).to.eventually.equal(false);
      });
    });
  });

  describe("#UntilHolidays", function() {
    context("from March 18 2022", function() {
      it("returns 16:11", function() {
        let d = new Date("2022-03-18");
        let r = {'totalDays' : 16, 'schoolDays' : 11};
        return expect(subject.nextHoliday(d)).to.eventually.deep.equal(r);
      });
    });
  });
  describe("#UntilHolidays", function() {
    context("from May 12 2022", function() {
      it("returns 45:32", function() {
        let d = new Date("2022-05-12");
        let r = {'totalDays' : 45, 'schoolDays' : 32};
        return expect(subject.nextHoliday(d)).to.eventually.deep.equal(r);
      });
    });
  });
});
