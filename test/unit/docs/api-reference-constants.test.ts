import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import * as PACKAGE from "../../../src/index";

const CONSTANTS_DIRECTORY: string = path.resolve("docs/api-reference/constants");

const PUBLIC_CONSTANTS: Array<string> = Object.keys(PACKAGE)
 .filter((name: string) => name.endsWith("_CONSTANT"))
 .sort();

/**
 * Returns the docs page slug of a constant, CONFIG_ENTITY_CONSTANT → config-entity-constant.
 * @param {string} name Constant name.
 * @returns {string} The slug.
 */
function toSlug(name: string): string {
 return name.toLowerCase().replaceAll("_", "-");
}

describe("API reference constants", () => {
 it("finds the public constants", () => {
  expect(PUBLIC_CONSTANTS.length).toBeGreaterThan(0);
 });

 it.each(PUBLIC_CONSTANTS)(
  "documents %s on its own page, in the sidebar and on the index",
  (name: string) => {
   const slug: string = toSlug(name);
   const pagePath: string = path.join(CONSTANTS_DIRECTORY, slug, "page.mdx");

   expect(existsSync(pagePath), pagePath).toBe(true);
   expect(readFileSync(pagePath, "utf8")).toContain(`# \`${name}\``);
   expect(readFileSync(path.join(CONSTANTS_DIRECTORY, "_meta.js"), "utf8")).toContain(
    `"${slug}": "${name}"`,
   );
   expect(readFileSync(path.join(CONSTANTS_DIRECTORY, "page.mdx"), "utf8")).toContain(
    `/docs/nestjs-crud-config/api-reference/constants/${slug})`,
   );
  },
 );
});
