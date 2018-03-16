"use strict";
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;
var db_Helper = require("../userdb_helper");
chai.config.includeStack = true;

describe("Testing Database Helper", function() {
  var subject = new db_Helper();
  context("Create New User", function() {
    it("returns true", function() {
      return expect(subject.setState("t12345", "QLD")).to.eventually.equal(
        true
      );
    });
  });
  context("Getting the User's State", function() {
    it("t12345 returns QLD", function() {
      return expect(subject.getState("t12345")).to.eventually.equal(
        "QLD"
      );
    });
    it("bill isn't in the database", function() {
      return expect(subject.getState("bill")).to.eventually.be.undefined;
    });
  });
});
