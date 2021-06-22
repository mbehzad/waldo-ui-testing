const puppeteer = require('puppeteer');
const {mqs} = require("./config");
const { chai: {expect}, setupPage} = require("../../index");

const headless = true;
const pageUrl = "http://localhost:8080/public/index.html";

describe("Navbar", function() {
  /** @type {puppeteer.Browser} */
  let browser;
  /** @type {puppeteer.Page} */
  let page;

  beforeEach(async function() {
    browser = await puppeteer.launch({headless});
    page = await browser.newPage();
  });

  afterEach(async function() {
    if (headless) {
      await page.close();
      await browser.close();
    }
  });

  for (const [mq, vp] of Object.entries(mqs)) {
    it(`[${mq}] - should show menu`, async function() {
      await setupPage(page, {url: pageUrl, viewport: vp});

      const menu = await page.$(".navbar");
      await expect(menu).to.not.be.visible();
      const button = await page.$(".burger-button");
      await button.click();
      await expect(menu).to.be.visible();
      await expect(menu).to.equalSnapshot();
    });
  }
});
