#!/usr/bin/env node

const globby = require("globby");
const { program } = require("commander");

const pkg = require("../package.json");
const { runner } = require("../lib/waldo");

program.version(pkg.version);

program
  .requiredOption("--testFiles <globPattern>", "glob pattern to test files")
  .requiredOption("--targetDir <dir>", "directory were the test report is saved to")
  .requiredOption("--fixtureDir <dir>", "directory were the snapshot for usage in future tests are saved to");

program.parse(process.argv);

const options = program.opts();

runner
  .run({
    testFiles: globby.sync((options.testFiles)),
    targetDir: options.targetDir,
    fixtureDir: options.fixtureDir,
  })
  .then(() => (process.exitCode = 0))
  .catch((failures) => {
    if (typeof failures === "number") process.exitCode = failures;
    // exception had been thrown outside the mocha tests. e.g. when importing packages etc.
    else {
      console.error(failures);
      process.exitCode = 1;
    }
  });
