const chai = require("chai");
const addContext = require("mochawesome/addContext");

const runner = require("./mocha-utils/runner");
const { setupPage } = require("./utils/page");

module.exports = {
  chai,
  runner,
  addContext,
  setupPage,
};
