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
  context("User Exists", function() {
    it("returns true", function() {
      return expect(subject.userExists("t12345")).to.eventually.equal(
        true
      );
    });
    it("returns false", function() {
      return expect(subject.userExists("bill")).to.eventually.equal(
        false
      );
    });
  });
  context("Getting the User's State", function() {
    it("returns QLD", function() {
      return expect(subject.getState("t12345")).to.eventually.equal(
        "QLD"
      );
    });
  });
});
