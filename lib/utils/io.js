const fs = require("fs");
const fsExtra = require("fs-extra");
const path = require("path");

function fileExist(path) {
  return new Promise((resolve, reject) => {
    fs.access(path, fs.constants.F_OK, (err) => {
      resolve(!Boolean(err));
    });
  });
}

async function copyFile(src, target) {
  // copy as new reference
  await fsExtra.copy(src, target);
}


module.exports = {
  fileExist,
  copyFile,
}