const fs = require("fs");
const addContext = require("mochawesome/addContext");
const fsExtra = require("fs-extra");
const { expect } = require("chai");

const { captureScreenshot, readToPNG, diffImages } = require("../utils/image");
const { fileExist, copyFile } = require("../utils/io");
const { getCurrentContext } = require("../mocha-utils/currentTest");
const config = require("../dynamicConfig");

/** @typedef {import("chai/lib/chai")} Chai */
/** @typedef {import("chai/lib/chai/utils")} Chai.utils */
/** @typedef {import("puppeteer").Page} Puppeteer.Page */
/** @typedef {import("puppeteer").ElementHandle} Puppeteer.ElementHandle */

/**
 * count the snapshots in each `it` path
 * @type {Object<string:number>}
 */
let memo = {};

/**
 * returns the path for describe1___describe2___...it___
 * @param {Object} ctx - this context of a mocha it callback
 */
function name(ctx) {
  const path = ctx.test.titlePath().join("___");

  // if there is multiple snapshoting inside one it; suffix with a counter
  let addition = "";
  if (memo.hasOwnProperty(path)) {
    memo[path]++;
    addition = "-" + memo[path];
  } else {
    memo[path] = 0;
  }

  return path + addition;
}

/**
 * chai plugin to create screenshots form page elements and compare them with the old snapshots to test against any regression
 *
 * @param {Chai} chai
 * @param {Chai.utils} _utils
 */
function plugin(chai, _utils) {
  // takes a snapshot,
  // if already a reference exist, pixelmatch
  chai.Assertion.addMethod("equalSnapshot", async function assertion(options = {}) {
    const context = getCurrentContext();
    // title of the outer `describe` in the test file
    const suitName = context.test.titlePath()[0];
    // name of the fixture based on the currents test titles
    const fileName = name(context);

    /**
     * @type{Puppeteer.Page|Puppeteer.ElementHandle}
     */
    const handler = this._obj;

    // #region capture screenshot

    const savePath = `${config.targetDir}/${suitName}/screenshot/${fileName}.png`;

    await captureScreenshot(handler, { path: savePath, ...options });
    addContext(context, "[captured result]");
    addContext(context, `./${suitName}/screenshot/${fileName}.png`);

    const actualScreenshotFile = savePath;

    // #endregion

    const snapshotFile = `${config.fixtureDir}/${suitName}/${fileName}.png`;
    const hasReferenceImage = await fileExist(snapshotFile);

    // first time, only save as fixture
    if (!hasReferenceImage) {
      await copyFile(actualScreenshotFile, snapshotFile);
      addContext(context, "fixture saved to disc as a reference for future tests.");
      return;
    }

    // #region compare

    const snapshotFileInTarget = `${config.targetDir}/${suitName}/fixture/${fileName}.png`;
    // copy copy to target to show in the report
    await copyFile(snapshotFile, snapshotFileInTarget);

    const expectedSnapshot = await readToPNG(snapshotFile);
    const actualScreenshot = await readToPNG(actualScreenshotFile);
    // expected
    addContext(context, "[expected]");
    addContext(context, `./${suitName}/fixture/${fileName}.png`);

    const [diff, numDiffPixels] = await diffImages(expectedSnapshot, actualScreenshot);

    // diff
    if (numDiffPixels !== 0) {
      await fsExtra.ensureDir(`${config.targetDir}/${suitName}/diff`);
      // save diff image
      diff
        .pack()
        .pipe(
          fs.createWriteStream(
            `${config.targetDir}/${suitName}/diff/${fileName}.png`
          )
        );

      addContext(context, "[diff]");
      addContext(context, `./${suitName}/diff/${fileName}.png`);
    }

    // #endregion

    // #region assertion

    // The files should be the same size.
    expect(actualScreenshot.width, "image widths are the same").equal(expectedSnapshot.width);
    expect(actualScreenshot.height, "image heights are the same").equal(expectedSnapshot.height);

    // The files should look the same.
    expect(numDiffPixels, "number of different pixels").equal(0);

    // #endregion
  });
}

module.exports = plugin;
