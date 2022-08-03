/// <reference types="chai" />

import type waldo from "./lib/waldo";

type EqualSnapshotOptions = {
  useClip?: boolean = false;
  padding?: number = 0;
  fullPage?: boolean = false;
  omitBackground?: boolean = false;
};

declare global {
    namespace Chai {
        interface Assertion {
          /**
           * Assertion to create screenshots form page elements and compare them with the old snapshots to test against any regression
           */
          equalSnapshot(options: EqualSnapshotOptions = {}): Assertion;

          /**
           * element exists and is visible
           */
          visible(): Assertion;
        }
    }
}

export = waldo;