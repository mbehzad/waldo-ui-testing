/** @typedef {import("chai/lib/chai")} Chai */
/** @typedef {import("chai/lib/chai/utils")} Chai.utils */
/** @typedef {import("puppeteer").Page} Puppeteer.Page */
/** @typedef {import("puppeteer").ElementHandle} Puppeteer.ElementHandle */

/**
 * chai plugin to check wether an element is "visible". i.e. it has dimensions.
 * whether or not the element is has opacity:0, masked by some other element laying on top of it or not being in the viewport
 *
 * @param {Chai} chai
 * @param {Chai.utils} _utils
 */
function plugin(chai, _utils) {

  chai.Assertion.addMethod("visible", async function assertion() {

    /**
     * @type{Puppeteer.Page|Puppeteer.ElementHandle}
     */
    const handler = this._obj;

    // e.g. `expect(el).to.**NOT**.be.visible`
    const isNegated = chai.util.flag(this, "negate");

    // element does not exist and therefor is `not.visible`
    if (isNegated && handler === null) return;

    new chai.Assertion(handler, "ElementHandler existing").to.not.be.null;

    // ignoring opacity: 0 etc.
    const box = await handler.boundingBox();
    const visible =
      // chrome
      box !== null
      // firefox will return `{ x: 0, y: 0, width: 0, height: 0 }`
      && !(box.x === 0 && box.y === 0 && box.width === 0 && box.height === 0);

    this.assert(
      visible,
      "expected ElementHandle to be visible",
      "expected ElementHandle to not be visible",
      "",   // expected
      "",   // actual;
      false // showDiff
    );
  });
}

module.exports = plugin;
