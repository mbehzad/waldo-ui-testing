/** @typedef {import("puppeteer").Page} Puppeteer.Page */
/** @typedef {import("puppeteer").ElementHandle} Puppeteer.ElementHandle */

// Chrome has a max height of 16384px for screenshots (https://github.com/puppeteer/puppeteer/issues/359)
const CHROME_MAX_PAGE_HEIGHT_FOR_SCREENSHOTS = 16_384;

/**
 *
 * @param {Puppeteer.Page} page -
 * @param {Object} options
 * @param {string} options.url - url for the page to get navigated to
 * @param {string} [options.moduleSelector] - (if provided,) instead of the page, returns the first element with this selector on the page
 * @param {function} [options.proxy] - function to intercept the request and redirect or respond to it
 * @param {{height: number, width: number}} [options.viewport] - sets the pages viewport to the given dimensions
 *
 * @returns {Puppeteer.Page | Puppeteer.ElementHandle}
 *
 * @example
 * setupPage(page, {
 *   url: "localhost:8080/index.html",
 *   moduleSelector: "form.login-dialog",
 *   viewport: {width: 480, height: 650},
 *   credentials: {username: "admin", password: "1234"}
 *   proxy(interceptedRequest) {
 *     const url = interceptedRequest.url();
 *     // proxy with asset from local dev server
 *     if (/.*\/app\.bundle\..*\.min\.js/.test(url))
 *       interceptedRequest.continue({url: "path/to/dev-server/app.js"});
 *     // respond with mock json
 *     else if (url.endsWith("shopping-cart.json"))
 *       interceptedRequest.respond({
 *         status: 200,
 *         contentType: "application/json",
 *         body: JSON.stringify([
 *           // items
 *         ]),
 *       });
 *     else
 *       interceptedRequest.continue();
 *   }
 *  })
 */
 async function setupPage(page, options) {

  if (options.credentials)
    await page.authenticate(credentials);

  if (options.proxy) {
    await page.setRequestInterception(true);
    page.on('request', options.proxy);
  }

  // otherwise the default 800×600px size will be loaded
  if (options.viewport) {
    let { width, height } = options.viewport;
    if (height === "auto") height = 10_000;
    await page.setViewport({width, height});
  }

  // i.e. "Chrome/92.0.4512.0" vs "Headless Firefox"
  const isChrome = await (await page.browser().version()).toLowerCase().includes("chrome");
  // firefox doesn't support the networkidle lifecycle events, switch to the default `load` event
  await page.goto(options.url, {waitUntil: isChrome ? "networkidle2" : "load" });

  if (options.viewport?.height === "auto") {
    // set window height equal to content height
    const body = await page.$("body")
    let pageHeight = await page.evaluate(el => el.scrollHeight, body);
    // first element might push stuff down in case of margin-top
    const marginTop = await page.evaluate(el => el.getBoundingClientRect().top , body);
    pageHeight += marginTop;

    pageHeight = Math.min(pageHeight, CHROME_MAX_PAGE_HEIGHT_FOR_SCREENSHOTS);

    await page.setViewport({ width, height: Math.ceil(pageHeight)});
  }

  if (options.moduleSelector) {
    const module = await page.$(options.moduleSelector);

    try {
      await page.$eval(options.moduleSelector, el => el.scrollIntoView());
    }
    catch (e) {
      // maybe not visible
      console.error(e)
    }

    return module;
  }

  return page;
}

module.exports = {
  setupPage,
};
