import type * as Package from "../../src/index";

// The e2e suites run against the build that npm run test:e2e produces first. The specifier is a variable, so lint:types
// checks the suites against the source declarations without a build.
const BUILT_PACKAGE_ENTRY_PATH: string = "../../dist/index.js";

export const BUILT_PACKAGE: typeof Package = (await import(
 BUILT_PACKAGE_ENTRY_PATH
)) as typeof Package;
