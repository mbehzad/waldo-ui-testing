const Mocha = require("mocha");
const chai = require("chai");

const chaiEqualSnapshot = require("../chai-plugins/equalSnapshot");
const chaiVisible = require("../chai-plugins/visible");
const { updateCurrentTest } = require("./currentTest");

const config = require("../dynamicConfig");


/**
 * runs the test files.
 * returns a promise which will be resolved after all tests have run and pass,
 * or rejected when any test fails.
 *
 * @param {Object} option
 * @param {string[]} option.testFiles - absolute path to the test suit files
 * @param {string} option.targetDir - relative path from cwd to the folder where the test results (images, htm and json report) will be saved to
 * @param {string} option.fixtureDir - relative path from cwd to the folder where the snapshot images from the visual test will be stored at
 *
 * @returns Promise<void>
 */
function run({testFiles, targetDir, fixtureDir}) {

  config.targetDir = targetDir;
  config.fixtureDir = fixtureDir;

  return new Promise((resolve, reject) => {

    // register custom assertion plugins
    chai.use(chaiEqualSnapshot);
    chai.use(chaiVisible);

    // Instantiate a Mocha instance.
    const mocha = new Mocha({
      ui: "bdd",
      reporter: "mochawesome",
      reporterOptions: {
        reportFilename: "report",
        reportDir: targetDir,
        reportTitle: "UI Test Report",
        reportPageTitle: "UI Test Report",
      },
      timeout: 60000,
      fullTrace: true,
    });

    // Add each test file to the mocha instance
    testFiles.forEach(filePath => mocha.addFile(filePath));

    console.time("Waldo running UI Tests");

    // Run the tests.
    mocha
      .run((failures) => {
        console.timeEnd("Waldo running UI Tests");
        if (failures) reject(failures);
        else resolve();
      })
      .on("test", (test) => {
        updateCurrentTest(test);
      });
  });
}

module.exports = {
  run
}
