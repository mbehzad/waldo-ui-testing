# Waldo UI Testing

> Combines the power of [Puppeteer](https://www.npmjs.com/package/puppeteer), [Mocha](https://www.npmjs.com/package/mocha), [Chai](https://www.npmjs.com/package/chai), [Pixelmatch](https://www.npmjs.com/package/pixelmatch) and [Mochawesome](https://www.npmjs.com/package/mochawesome) to provide a testing library which brings out of the box support for BDD visual regression testing.

<!-- vscode-markdown-toc -->
* [Install](#Install)
* [Usage](#Usage)
* [Exports](#Exports)
  * [chai](#chai)
    * [visible](#visible)
    * [equalSnapshot](#equalSnapshot)
  * [setupPage](#setupPagepageoptionsPuppeteer.PagePuppeteer.ElementHandle)
  * [addContext](#addContext)
  * [runner](#runner)
* [CLI Options](#CLIOptions)
* [Node API](#NodeAPI)
* [Troubleshooting](#Troubleshooting)
* [Demo](#Demo)
* [Author](#Author)
* [License](#License)

<!-- vscode-markdown-toc-config
	numbering=false
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->

## <a name='Install'></a>Install

```sh
npm install waldo-ui-testing puppeteer
```

## <a name='Usage'></a>Usage

Test Spec

```javascript
// my-test.spec.js

const puppeteer = require('puppeteer');
const { chai: {expect}, setupPage} = require("waldo-ui-testing");

const mqs = {
  Mobile: {width: 480, height: 10_000},
  Desktop: {width: 1024, height: 10_000},
}

describe("Navbar", function() {
  let browser;
  let page;

  beforeEach(async function() {
    browser = await puppeteer.launch({headless: true});
    page = await browser.newPage();
  });

  afterEach(async function() {
    await page.close();
    await browser.close();
  });

  for (const [mq, vp] of Object.entries(mqs)) {

    it(`[${mq}] - should show menu`, async function() {
      await setupPage(page, {url: "/test-page/url", viewport: vp});

      const menu = await page.$(".navbar");
      await expect(menu).to.not.be.visible();
      const button = await page.$(".burger-button");
      await button.click();
      await expect(menu).to.be.visible();
      await expect(menu).to.equalSnapshot(); // <=== visual regression testing
    });
  }
});
```

CLI execution

```properties
waldo --testFiles *.spec.js --targetDir target/ui-test --fixtureDir fixture
```

Output

```sh
  Navbar
    ✔ [Mobile] - should show menu (2030ms)
    1) [Desktop] - should show menu


  1 passing (7s)
  1 failing
```

HTML Report

<img src="https://github.com/mbehzad/waldo-ui-testing/blob/master/images/demo-report.png">

## <a name='Exports'></a>Exports

### <a name='chai'></a>chai

Copy of chai assertion library where two additional assertions are registered:

#### <a name='visible'></a>visible

`await expect(handler).to.be.visible();`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| handler | `Puppeteer.ElementHandle` |  | - |

will check if the element exists and has a bounding client rect with some dimensions. This means elements which have an `opacity: 0` or are rendered outside the viewport are also treated as visible.

#### <a name='equalSnapshot'></a>equalSnapshot

`await expect(handler).to.equalSnapshot(options?);`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| handler | `Puppeteer.Page | Puppeteer.ElementHandle` |  | - |
| options | `[Object]` |  | - |
| options.useClip | `boolean` | `false` | instead of isolating the element before taking screenshot, a screenshot of the page is taken with the coordinate of the element |
| options.padding | `number` | `0` | (use with `useClip`) an outside padding to the element bounding client rect will be added before taking screenshot |

Will take a screenshot of the page or element, and visually compare to the snapshot from the first run.

### <a name='setupPagepageoptionsPuppeteer.PagePuppeteer.ElementHandle'></a>setupPage(page, options) ⇒ `Puppeteer.Page` \| `Puppeteer.ElementHandle`

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| page | `Puppeteer.Page` |  | - |
| options | `Object` |  |  |
| options.url | `string` |  | url for the page to get navigated to |
| [options.moduleSelector] | `string` |  | (if provided,) instead of the page, returns the first element with this selector on the page |
| [options.proxy] | `function` |  | function to intercept the request and redirect or respond to it (see Puppeteer's [page.setRequestInterception](https://pptr.dev/#?product=Puppeteer&version=v10.0.0&show=api-pagesetrequestinterceptionvalue)) |
| [options.viewport] | `{height: number, width: number}` | `{width: 800, height: 600}` | sets the pages viewport to the given dimensions (see Puppeteer's [page.setViewport](https://pptr.dev/#?product=Puppeteer&version=v10.0.0&show=api-pagesetviewportviewport)) |
| [options.credentials] | `{username: string, password: string}` |   | basic auth credentials (see Puppeteer's [page.authenticate](https://pptr.dev/#?product=Puppeteer&version=v10.0.0&show=api-pageauthenticatecredentials)) |

A helper function that helps preparing a puppeteer page before the test. It isn't mandatory to use this helper, you can simply do the page navigation etc. yourself.

example usage:

```javascript
setupPage(page, {
  url: "test-domain/index.html",
  moduleSelector: "form.login-dialog",
  viewport: {width: 480, height: 650},
  credentials: {username: "admin", password: "1234"},
  proxy(interceptedRequest) {
    const url = interceptedRequest.url();
    // proxy with asset from local dev server
    if (/.*\/app\.bundle\..*\.min\.js/.test(url))
      interceptedRequest.continue({url: "path/to/dev-server/app.js"});
    // respond with mock json
    else if (url.endsWith("shopping-cart.json"))
      interceptedRequest.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          /* items */
        ]),
      });
    else
      interceptedRequest.continue();
  }
})
```

### <a name='addContext'></a>addContext

Adds additional information to a test.  e.g.

```js
addContext(this, "some additional information for the test report.")
```

See mochaawsome's `addContext` [documentation](https://github.com/adamgruber/mochawesome#adding-test-context) for more info.

### <a name='runner'></a>runner

See [Node API](#NodeAPI) section.

## <a name='CLIOptions'></a>CLI Options

### `--testFiles`

glob pattern to test files, relative from the cwd.

### `--targetDir`

oath to the directory were the test result (images, html and json reports) are saved relative from cwd.

### `--fixtureDir`

path to the directory were the snapshot for usage in future tests are automatically saved when a test is executed the first time, relative from cwd.

For each test file a folder with the title of the top `describe` in that test file will be created.

Snapshot filenames are the combination of the `describe` and `it` titles. Snapshots after the first snapshot will get a counter at the end of the filename.

e.g.

```javascript
describe("Navbar", function() {
  describe("Mobile", function() {
    it(`should show menu`, async function() {
      // ...
      await expect(menu).to.equalSnapshot();
      // some other actions ...
      await expect(menu).to.equalSnapshot();
    });
  });
});
```

will create:

 `fixtureDir/Navbar/Navbar___Mobile___should show menu.png`
 `fixtureDir/Navbar/Navbar___Mobile___should show menu-1.png`

## <a name='NodeAPI'></a>Node API

example usage:

```javascript
const runner = require("waldo-ui-testing");
runner.run({
  testFiles: ["path/to/test-file"],
  targetDir: "target/ui-tets",
  fixtureDir: "tests/fixture",
})
  .then(/* tests passed */)
  .catch(/* tests failed */)
```

Runs the test files. returns a promise which will be resolved after all tests have run and passed, or rejected (with the number of failed tests) when any test fails.

| Param | Type | Description |
| --- | --- | --- |
| option | <code>Object</code> |  |
| option.testFiles | <code>Array.&lt;string&gt;</code> | absolute path to the test suit files |
| option.targetDir | <code>string</code> | relative path from cwd to the folder where the test results (images, html and json report) will be saved to |
| option.fixtureDir | <code>string</code> | relative path from cwd to the folder where the snapshot images from the visual tests will be stored at |

## <a name='Troubleshooting'></a>Troubleshooting

### Debug in _headful_ mode

Sometimes it helps to see what the browser sees. For that:

1. run the misbehaving test isolated via `it.only(...)`,
2. launch the puppeteer browser in headful mode via `browser = await puppeteer.launch({ headless: false })`
3. and don't `browser.close()` the browser after the test fails.

### Timeout

Some times some requests may take longer to finish or there are some animations/transition before component reaches its new state. In that case a time out ( e.g. `page.waitForTimeout(1000)`) could do wonders.
But keep in mind, add many of them and your tests will take longer to finish!

### Clipped image

When the component is cutoff in the screenshot, it might help the set the height of the viewport to some big values (e.g. `setupPage(page, {url: viewport: {height: 100_000, width}})`), this might prevent the scroll when chrome isolates the element to take a screenshot.

If that doesn't help, you could use the `useClip` option (i.e. `await expect(handler).to.equalSnapshot({useClip: true})`) to prevent the isolation before screenshot.

### await

Due to async nature of puppeteer's browser handling, many commands need waiting for their completion, this includes the `is.visible` and `to.equalSnapshot` assertions as well.

### Firefox

To run the tests in a firefox browser, you have to install puppeteer with firefox (`PUPPETEER_PRODUCT=firefox npm i puppeteer`) and launch the browser with firefox:

```javascript
browser = await puppeteer.launch({
  product: "firefox",
  headless
})
```

for more info see puppeteer's [docs](https://github.com/puppeteer/puppeteer#q-which-firefox-version-does-puppeteer-use).

## <a name='Demo'></a>Demo

checkout git repository and run `npm run demo`.

Demo test is located [here](https://github.com/mbehzad/waldo-ui-testing/blob/master/demo/).

## <a name='Author'></a>Author

👤 **mbehzad**

* Github: [@mbehzad](https://github.com/mbehzad)

## <a name='License'></a>📝 License

Copyright © 2021 [mbehzad](https://github.com/mbehzad).<br />
This project is [MIT](https://github.com/mbehzad/waldo-ui-testing/blob/master/LICENSE) licensed.
