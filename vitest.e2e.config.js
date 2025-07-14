// eslint-disable-next-line @elsikora/unicorn/prevent-abbreviations
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
  include: ["test/e2e/**/*.test.ts"],
  root: ".",
  testTimeout: 10_000,
  watch: false,
 },
});
