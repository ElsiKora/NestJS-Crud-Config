#!/usr/bin/env node
/**
 * Consumer smoke test for the packed package.
 *
 * Packs the built package and installs the tarball with the peer stack (Automator 5, Nest 12, TypeORM 1) into a
 * temporary project, and fails if npm nests a second copy of a peer. It checks that importing the package (ESM import
 * and CommonJS require) prints nothing and leaves process.env alone even with a .env file in the working directory,
 * and runs tsc --noEmit with skipLibCheck off over every declaration file of the installed package with nodenext,
 * bundler and node10 resolution, so a declaration that imports a path the peer does not export fails even when no
 * app reaches it. Then, for every consumer in test/consumer (ESM bundler, ESM nodenext, CommonJS node10 and CommonJS with the default
 * resolution, both through require(esm)), it typechecks the app in test/consumer/app/src with skipLibCheck off and
 * runs it: a Nest 12 Fastify application with CrudConfigModule.register and registerAsync against Postgres runs its
 * startup migration, writes and reads encrypted and cached values, serves the generated section and data routes,
 * builds the OpenAPI document and closes. The swc consumer builds the same app to ES modules with SWC, as the Nest CLI
 * SWC builder does, and tsc only typechecks it with bundler resolution.
 * DATABASE_URL selects an existing database; otherwise a testcontainers Postgres is started and removed afterwards.
 *
 * Flags: --skip-build reuses the current dist, --keep leaves the temporary project in place, --peer-floors installs
 * every peerDependency at the lower bound of its range instead of the repository devDependency versions, and fails
 * unless exactly those versions were installed.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONSUMER_ROOT = path.join(ROOT, "test/consumer");
const REPOSITORY_MANIFEST = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
const PACKAGE_NAME = REPOSITORY_MANIFEST.name;

const CONSUMERS = [
 { name: "bundler", type: "module" },
 { name: "nodenext", type: "module" },
 { name: "commonjs", type: "commonjs" },
 // The Core and Gameport shape: module commonjs without moduleResolution, which TypeScript 6 resolves as bundler
 { name: "commonjs-default", type: "commonjs" },
 // Native ES modules built by SWC, as the Nest CLI SWC builder does; typechecked by tsc --noEmit
 { compiler: "swc", name: "swc", type: "module" },
];

const STACK = [
 "@elsikora/nestjs-crud-automator",
 "@fastify/static",
 "@nestjs/common",
 "@nestjs/core",
 "@nestjs/passport",
 "@nestjs/platform-fastify",
 "@nestjs/swagger",
 "@nestjs/throttler",
 "@nestjs/typeorm",
 "class-transformer",
 "class-validator",
 "fastify",
 "lodash",
 "pg",
 "reflect-metadata",
 "rxjs",
 "typeorm",
 "typescript",
];
// @types/node follows the oldest supported Node major: newer majors drop worker_threads types that pino's thread-stream still declares
const TYPES_NODE_RANGE = "^22.13.0";
// The SWC toolchain is not a repository devDependency, so the smoke pins it exactly
const SWC_TOOLCHAIN = { "@swc/cli": "0.8.1", "@swc/core": "1.16.18" };

const IMPORT_CHECKS = [
 {
  arguments_: [
   "--input-type=module",
   "--eval",
   `await import(${JSON.stringify(PACKAGE_NAME)}); console.log(JSON.stringify(process.env.SMOKE_DOTENV ?? null));`,
  ],
  name: "esm import",
 },
 {
  arguments_: [
   "--input-type=commonjs",
   "--eval",
   `require(${JSON.stringify(PACKAGE_NAME)}); console.log(JSON.stringify(process.env.SMOKE_DOTENV ?? null));`,
  ],
  name: "commonjs require",
 },
];

// Every declaration of the installed tarball is typechecked under each resolution a consumer may use
const DECLARATION_CHECKS = [
 { module: "nodenext", moduleResolution: "nodenext", name: "nodenext" },
 { module: "esnext", moduleResolution: "bundler", name: "bundler" },
 { ignoreDeprecations: "6.0", module: "commonjs", moduleResolution: "node10", name: "node10" },
];
// An app that leaves a pool or a server open never exits, so a hang fails the consumer instead of the CI job timeout
const APP_TIMEOUT_MS = 120_000;
const ARGS = new Set(process.argv.slice(2));

/**
 * Returns the lower bound of every peerDependency range, such as 12.3.2 for "^12.3.2" or 5.0.0-dev.5 for "^5.0.0-dev.5".
 * @param {Record<string, string>} peerDependencies - The repository peerDependencies.
 * @returns {Record<string, string>} Exact versions by package name.
 */
function getPeerFloors(peerDependencies) {
 const floors = {};

 for (const [name, range] of Object.entries(peerDependencies)) {
  const floor = /^(?:>=|\^)(\d+\.\d+\.\d+(?:-[\w.]+)?)(?:\s|$)/.exec(range)?.[1];

  if (!floor) {
   throw new Error(`The peer range of ${name} has no >= or ^ lower bound: ${range}`);
  }

  floors[name] = floor;
 }

 return floors;
}

/**
 * Runs a command with inherited output and fails the smoke when it exits non-zero.
 * @param {string} command - Executable.
 * @param {Array<string>} commandArguments - Arguments.
 * @param {{ cwd: string, env?: NodeJS.ProcessEnv, timeout?: number }} options - Working directory, environment and a timeout in milliseconds.
 * @returns {void}
 */
function run(command, commandArguments, options) {
 process.stdout.write(`$ ${command} ${commandArguments.join(" ")}\n`);
 execFileSync(command, commandArguments, {
  cwd: options.cwd,
  env: options.env ?? process.env,
  stdio: "inherit",
  timeout: options.timeout,
 });
}

/**
 * Builds the temporary project manifest: the tarball plus the stack versions the repository tests with.
 * @param {string} tarball - Absolute tarball path.
 * @returns {string} The manifest JSON.
 */
function createManifest(tarball) {
 const dependencies = {
  [PACKAGE_NAME]: `file:${tarball}`,
  "@types/node": TYPES_NODE_RANGE,
  ...SWC_TOOLCHAIN,
 };

 for (const name of STACK) {
  const version = REPOSITORY_MANIFEST.devDependencies[name];

  if (!version) {
   throw new Error(`The repository has no devDependency ${name} to pin the consumer stack to`);
  }

  dependencies[name] = version;
 }

 if (ARGS.has("--peer-floors")) {
  Object.assign(dependencies, getPeerFloors(REPOSITORY_MANIFEST.peerDependencies));
 }

 return JSON.stringify(
  { dependencies, name: "crud-config-consumer-smoke", private: true },
  undefined,
  "\t",
 );
}

/**
 * Fails when npm installed more than one copy of a peer, which would split class identity between the package and the app.
 * @param {string} directory - Directory with the installed project.
 * @returns {void}
 */
function checkSinglePeerCopies(directory) {
 for (const name of Object.keys(REPOSITORY_MANIFEST.peerDependencies)) {
  const result = spawnSync("npm", ["ls", name, "--all", "--parseable"], {
   cwd: directory,
   encoding: "utf8",
  });

  const copies = new Set(
   result.stdout.split("\n").filter((line) => line.endsWith(path.join("node_modules", name))),
  );

  if (copies.size !== 1) {
   throw new Error(`${name} is installed ${String(copies.size)} times: ${[...copies].join(", ")}`);
  }
 }

 process.stdout.write("PASS every peer is installed once\n");
}

/**
 * Imports the package in a fresh process next to a .env file and checks that the import prints nothing and loads no variables.
 * @param {string} directory - Directory with the installed package and the .env file.
 * @param {{ arguments_: Array<string>, name: string }} check - The Node.js arguments for one module system.
 * @returns {void}
 */
function checkSilentImport(directory, check) {
 const result = spawnSync(process.execPath, check.arguments_, { cwd: directory, encoding: "utf8" });

 if (result.status !== 0 || result.stderr !== "" || result.stdout !== "null\n") {
  throw new Error(
   `${check.name} of ${PACKAGE_NAME} is not silent: exit ${String(result.status)}, stdout ${JSON.stringify(result.stdout)}, stderr ${JSON.stringify(result.stderr)}`,
  );
 }

 process.stdout.write(`PASS ${check.name} prints nothing and loads no .env\n`);
}

/**
 * Typechecks every declaration file of the installed package with skipLibCheck off.
 * @param {string} directory - Directory with the installed project.
 * @param {{ ignoreDeprecations?: string, module: string, moduleResolution: string, name: string }} check - Module settings.
 * @returns {void}
 */
function checkDeclarations(directory, check) {
 const { name, ...moduleOptions } = check;
 const configPath = path.join(directory, `tsconfig.declarations-${name}.json`);

 writeFileSync(
  configPath,
  JSON.stringify({
   compilerOptions: {
    ...moduleOptions,
    noEmit: true,
    skipLibCheck: false,
    strict: true,
    target: "ES2023",
    types: ["node"],
   },
   // The default exclude drops node_modules, which holds the declarations under test
   exclude: [],
   include: [`node_modules/${PACKAGE_NAME}/dist/**/*.d.ts`],
  }),
 );
 run(
  process.execPath,
  [path.join(directory, "node_modules/typescript/bin/tsc"), "-p", configPath],
  { cwd: directory },
 );
 process.stdout.write(`PASS declarations typecheck with ${name} resolution\n`);
}

/**
 * Returns a database URL: DATABASE_URL when set, otherwise a fresh testcontainers Postgres.
 * @returns {Promise<{ stop: () => Promise<void>, url: string }>} The URL and a stop callback.
 */
async function startDatabase() {
 if (process.env.DATABASE_URL) {
  return { stop: async () => {}, url: process.env.DATABASE_URL };
 }

 const { PostgreSqlContainer } = await import("@testcontainers/postgresql");
 const container = await new PostgreSqlContainer("postgres:17-alpine").start();

 return { stop: async () => void (await container.stop()), url: container.getConnectionUri() };
}

const workDirectory = mkdtempSync(path.join(tmpdir(), "crud-config-consumer-"));
let database;
let failed = false;

try {
 if (!ARGS.has("--skip-build")) {
  run("npm", ["run", "build"], { cwd: ROOT });
 }

 run("npm", ["pack", "--pack-destination", workDirectory], { cwd: ROOT });

 const tarball = path.join(
  workDirectory,
  readdirSync(workDirectory).find((file) => file.endsWith(".tgz")),
 );

 writeFileSync(path.join(workDirectory, "package.json"), createManifest(tarball));
 run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error"], { cwd: workDirectory });

 if (ARGS.has("--peer-floors")) {
  for (const [name, floor] of Object.entries(getPeerFloors(REPOSITORY_MANIFEST.peerDependencies))) {
   const installed = JSON.parse(
    readFileSync(path.join(workDirectory, "node_modules", name, "package.json"), "utf8"),
   ).version;

   if (installed !== floor) {
    throw new Error(`${name} is ${installed}, not its floor ${floor}`);
   }

   process.stdout.write(`peer floor ${name}@${installed}\n`);
  }
 }

 checkSinglePeerCopies(workDirectory);
 writeFileSync(path.join(workDirectory, ".env"), "SMOKE_DOTENV=loaded\n");
 process.stdout.write(`\n=== import side effects (Node.js ${process.version}) ===\n`);

 for (const check of IMPORT_CHECKS) {
  checkSilentImport(workDirectory, check);
 }

 process.stdout.write(`\n=== declarations (skipLibCheck off) ===\n`);

 for (const check of DECLARATION_CHECKS) {
  try {
   checkDeclarations(workDirectory, check);
  } catch {
   failed = true;
   process.stdout.write(`declarations ${check.name} FAILED\n`);
  }
 }

 database = await startDatabase();

 for (const consumer of CONSUMERS) {
  const consumerDirectory = path.join(workDirectory, consumer.name);

  cpSync(path.join(CONSUMER_ROOT, "app/src"), path.join(consumerDirectory, "src"), {
   recursive: true,
  });
  cpSync(
   path.join(CONSUMER_ROOT, consumer.name, "tsconfig.json"),
   path.join(consumerDirectory, "tsconfig.json"),
  );
  writeFileSync(
   path.join(consumerDirectory, "package.json"),
   JSON.stringify({ name: `consumer-${consumer.name}`, private: true, type: consumer.type }),
  );

  try {
   process.stdout.write(
    `\n=== consumer ${consumer.name} (${consumer.type}, Node.js ${process.version}) ===\n`,
   );
   run(
    process.execPath,
    [path.join(workDirectory, "node_modules/typescript/bin/tsc"), "-p", "tsconfig.json"],
    { cwd: consumerDirectory },
   );

   if (consumer.compiler === "swc") {
    cpSync(
     path.join(CONSUMER_ROOT, consumer.name, ".swcrc"),
     path.join(consumerDirectory, ".swcrc"),
    );
    run(
     process.execPath,
     [
      path.join(workDirectory, "node_modules/@swc/cli/bin/swc.js"),
      "src",
      "--out-dir",
      "dist",
      "--strip-leading-paths",
      "--config-file",
      ".swcrc",
     ],
     { cwd: consumerDirectory },
    );
   }

   run(process.execPath, ["dist/main.js"], {
    cwd: consumerDirectory,
    env: { ...process.env, DATABASE_URL: database.url },
    timeout: APP_TIMEOUT_MS,
   });
  } catch {
   failed = true;
   process.stdout.write(`consumer ${consumer.name} FAILED\n`);
  }
 }
} catch (error) {
 failed = true;
 process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
} finally {
 await database?.stop();

 if (ARGS.has("--keep")) {
  process.stdout.write(`Kept ${workDirectory}\n`);
 } else {
  rmSync(workDirectory, { force: true, recursive: true });
 }
}

process.exitCode = failed ? 1 : 0;
