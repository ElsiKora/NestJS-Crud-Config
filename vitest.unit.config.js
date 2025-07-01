import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
 plugins: [tsconfigPaths()],
 publicDir: false,
 resolve: {
  alias: {
   lodash: "lodash",
   "lodash/random": "lodash/random.js",
  },
 },
 test: {
  coverage: {
   include: ["src/**/*"],
   provider: "v8",
   reporter: ["text", "json", "html"],
  },
  deps: {
   inline: ["@elsikora/nestjs-crud-automator"],
  },
  environment: "node",
  exclude: ["node_modules/**/*"],
  globals: true,
  include: ["test/unit/**/*.test.ts"],
  onConsoleLog(log) {
   if (log.includes("Sourcemap for") && log.includes("points to missing source files")) {
    return false;
   }
  },
  root: ".",
  testTimeout: 10_000,
  watch: false,
 },
});
