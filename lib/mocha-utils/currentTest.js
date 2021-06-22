/** @typedef {import("mocha").Test} Mocha.Test */
/** @typedef {import("mocha").Context} Mocha.Context */

/**
 * test (`mocha.it`) which is currently running
 * @type {Mocha.Test}
 */
let currentTest = null;

module.exports = {

  /**
   * updates the reference to the current test which will be run by mocha
   *
   * @param {Mocha.Test} test
   */
  updateCurrentTest(test) {
    currentTest = test;
  },

  /**
   * returns the context (this) in the current running `it` test.
   *
   * @returns {Mocha.Context}
   */
  getCurrentContext() {
    return currentTest.ctx;
  },
};
