import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import generatePackageJson from "rollup-plugin-generate-package-json";
import dts from "unplugin-dts/rollup";

const external = [
 "@nestjs/common",
 "@nestjs/cache-manager",
 "@nestjs/event-emitter",
 "@aws-sdk/client-ssm",
 "@nestjs/common",
 "@nestjs/typeorm",
 "typeorm",
 "@elsikora/nestjs-crud-automator",
 "dotenv/config",
];

export default [
 {
  external,
  input: "src/index.ts",
  output: {
   dir: "dist/esm",
   entryFileNames: (chunkInfo) => {
    if (chunkInfo.name.includes("node_modules")) {
     return chunkInfo.name.replace("node_modules", "external") + ".js";
    }

    return "[name].js";
   },
   format: "esm",
   preserveModules: true,
   preserveModulesRoot: "src",
   sourcemap: true,
  },
  plugins: [
   resolve({
    include: ["node_modules/tslib/**"],
   }),
   typescript({
    declaration: false,
    outDir: "dist/esm",
    sourceMap: true,
    tsconfig: "./tsconfig.build.json",
   }),
   dts({
    entryRoot: "src",
    outDirs: ["dist/esm", "dist/cjs"],
    tsconfigPath: "./tsconfig.build.json",
   }),
   generatePackageJson({
    baseContents: { type: "module" },
    outputFolder: "dist/esm",
   }),
  ],
 },
 {
  external,
  input: "src/index.ts",
  output: {
   dir: "dist/cjs",
   entryFileNames: (chunkInfo) => {
    if (chunkInfo.name.includes("node_modules")) {
     return chunkInfo.name.replace("node_modules", "external") + ".js";
    }

    return "[name].js";
   },
   exports: "named",
   format: "cjs",
   preserveModules: true,
   preserveModulesRoot: "src",
   sourcemap: true,
  },
  plugins: [
   resolve({
    include: ["node_modules/tslib/**"],
   }),

   typescript({
    declaration: false,
    outDir: "dist/cjs",
    sourceMap: true,
    tsconfig: "./tsconfig.build.json",
   }),
   generatePackageJson({
    baseContents: { type: "commonjs" },
    outputFolder: "dist/cjs",
   }),
  ],
 },
];
