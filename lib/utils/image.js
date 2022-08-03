const fs = require("fs");
const pth = require("path");
const PNG = require("pngjs").PNG;
const pixelmatch = require("pixelmatch");
const Jimp = require("jimp");
const fsExtra = require("fs-extra");

/** @typedef {import("puppeteer").Page} Puppeteer.Page */
/** @typedef {import("puppeteer").ElementHandle} Puppeteer.ElementHandle */


/**
 * takes a screenshot of the element and saves to file
 *
 * @param {Puppeteer.Page|Puppeteer.ElementHandle} handler
 * @param {Object} [{
 *     path,
 *     padding = 0,
 *     useClip = false,
 *     fullPage = false,
 *     omitBackground = false,
 *   }={}]
 * @returns
 */
 async function captureScreenshot(
  handler,
  {
    path,
    padding = 0,
    useClip = false,
    fullPage = false,
    omitBackground = false,
  } = {}
) {
  await fsExtra.ensureDir(pth.dirname(path));
  if (useClip || padding) {
    const page = handler.executionContext().frame()._frameManager._page;

    const rect = await handler.boundingBox();

    return page.screenshot({
      path: path,
      clip: {
        x: rect.x - padding,
        y: rect.y - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      },
      omitBackground,
    });
  }

  return handler.screenshot({ path, fullPage, omitBackground });
}

/**
 * reads the content of a .png file and converts to a PNG instance
 *
 * @param {string} filePath
 * @returns {PNG}
 */
function readToPNG(filePath) {
  return new Promise((resolve) => {
    const png = fs.createReadStream(filePath).pipe(new PNG()).on("parsed", () => resolve(png));
  });
}

/**
 * converts instance of a jimp image to a PNG image
 *
 * @param {Jimp} jimpImg
 * @returns {PNG}
 */
function getPngFromJimp(jimpImg) {
  return new Promise(async (resolve, reject) => {
    const png = new PNG();
    const buffer = await jimpImg.getBufferAsync(Jimp.MIME_PNG);
    png.parse(buffer, (err, val) => {
      if (err) reject(err);
      else resolve(val)
    });
  })
}

/**
 * converts PNG to jimp object
 *
 * @param {PNG} pngImg
 * @returns {Promise<Jimp>}
 */
function getJimpFromPNG(pngImg) {
  return Jimp.read(PNG.sync.write(pngImg));
}

/**
 * compares pixels of two images and highlights and count the differences
 *
 * @param {PNG} img1 - base image
 * @param {PNG} img2 - image to be compared to the base image
 *
 * @returns Promise<[PNG, number]> - image where the different pixels are highlighted in red, and the total number of these pixels
 */
async function diffImages(img1, img2) {
  const maxHeigh = Math.max(img1.height, img2.height);
  const maxWidth = Math.max(img1.width, img2.width);

  // screenshots have different dimensions
  if (img1.width !== img2.width || img1.height !== img2.height) {
    // fill the images with this generic bg pattern to both have equal sizes and comparable
    const bg = await Jimp.read(pth.resolve(__dirname, "../../images/bg.png"));

    if (img1.width < maxWidth || img1.height < maxHeigh) {

      let img1_jimp = await getJimpFromPNG(img1);
      img1_jimp = bg.clone().resize(maxWidth, maxHeigh).blit(img1_jimp, 0, 0);
      img1 = await getPngFromJimp(img1_jimp);
    }

    if (img2.width < maxWidth || img2.height < maxHeigh) {
      let img2_jimp = await getJimpFromPNG(img2);
      img2_jimp = bg.clone().resize(maxWidth, maxHeigh).blit(img2_jimp, 0, 0);
      img2 = await getPngFromJimp(img2_jimp);
    }
  }

  // Do the visual diffing.
  const diff = new PNG({ width: maxWidth, height: maxHeigh });

  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    maxWidth,
    maxHeigh,
    { threshold: 0.001 }
  );

  return [diff, numDiffPixels];
}

module.exports = {
  captureScreenshot,
  readToPNG,
  getPngFromJimp,
  diffImages,
};
