import type { ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import type { DataSource } from "typeorm";

import { readdirSync } from "node:fs";
import path from "node:path";

import ts from "typescript";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { CrudConfigService } from "../../../../src/modules/config/config.service";
import { ConfigMigrationRunnerService } from "../../../../src/modules/config/migration/migration-runner.service";
import { ConfigMigrationService } from "../../../../src/modules/config/migration/migration.service";
import type { IConfigMigration } from "../../../../src/modules/config/migration/interface";
import { LoggerUtility } from "../../../../src/shared/utility/logger.utility";

const SOURCE_ROOT: string = path.resolve("src");
const LOGGER_UTILITY_PATH: string = path.join(SOURCE_ROOT, "shared/utility/logger.utility.ts");
const NEST_LOGGERS: ReadonlySet<string> = new Set(["ConsoleLogger", "Logger"]);
// Outside src, so it is never scanned; its references define the symbols the guard rejects
const TARGETS_PATH: string = path.resolve("__logging-targets__.ts");
const TARGETS_SOURCE: string = [
 'import * as consoleModule from "console";',
 'import * as nodeConsoleModule from "node:console";',
 "export const targets = [process.stdout, process.stderr, process.emitWarning, console, consoleModule, nodeConsoleModule];",
 "",
].join("\n");

/**
 * Lists every TypeScript source file of the package.
 * @param {string} directory Directory to walk.
 * @returns {Array<string>} Absolute file paths.
 */
function listSources(directory: string): Array<string> {
 return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const entryPath: string = path.join(directory, entry.name);

  if (entry.isDirectory()) {
   return listSources(entryPath);
  }

  return entry.name.endsWith(".ts") ? [entryPath] : [];
 });
}

/**
 * Resolves the symbol a node refers to, through import aliases.
 * @param {ts.TypeChecker} checker Type checker.
 * @param {ts.Node} node Identifier, string literal or module specifier.
 * @returns {ts.Symbol | undefined} The symbol, undefined for an unresolved name.
 */
function resolveSymbol(checker: ts.TypeChecker, node: ts.Node): ts.Symbol | undefined {
 const symbol: ts.Symbol | undefined = checker.getSymbolAtLocation(node);

 return symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

/**
 * Tells whether an import or export declaration brings in types only, so it loads no value.
 * @param {ts.ExportDeclaration | ts.ImportDeclaration} node Declaration.
 * @returns {boolean} True for import type, export type and declarations whose specifiers are all marked type.
 */
function isTypeOnlyDeclaration(node: ts.ExportDeclaration | ts.ImportDeclaration): boolean {
 const clause: ts.ImportClause | undefined = ts.isImportDeclaration(node)
  ? node.importClause
  : undefined;
 const specifiers: ts.NamedExportBindings | ts.NamedImportBindings | undefined =
  ts.isImportDeclaration(node) ? clause?.namedBindings : node.exportClause;

 if ((ts.isExportDeclaration(node) && node.isTypeOnly) || clause?.isTypeOnly) {
  return true;
 }

 return (
  !clause?.name &&
  specifiers !== undefined &&
  (ts.isNamedImports(specifiers) || ts.isNamedExports(specifiers)) &&
  specifiers.elements.length > 0 &&
  specifiers.elements.every(
   (element: ts.ExportSpecifier | ts.ImportSpecifier) => element.isTypeOnly,
  )
 );
}

/**
 * Tells whether a node sits in a type position, which never logs.
 * @param {ts.Node} node Node.
 * @returns {boolean} True inside type annotations, type queries, type arguments and type-only imports and exports.
 */
function isInTypePosition(node: ts.Node): boolean {
 for (let current: ts.Node = node; !ts.isSourceFile(current); current = current.parent) {
  if (ts.isExpressionWithTypeArguments(current) && ts.isHeritageClause(current.parent)) {
   return current.parent.token === ts.SyntaxKind.ImplementsKeyword;
  }

  if (ts.isTypeNode(current)) {
   return true;
  }

  if ((ts.isImportSpecifier(current) || ts.isExportSpecifier(current)) && current.isTypeOnly) {
   return true;
  }

  if (
   (ts.isImportDeclaration(current) || ts.isExportDeclaration(current)) &&
   isTypeOnlyDeclaration(current)
  ) {
   return true;
  }
 }

 return false;
}

/**
 * Collects the symbols of Node's process.stdout, process.stderr and process.emitWarning, the global console and the
 * console modules from the targets file.
 * @param {ts.Program} program Program that includes the targets file.
 * @param {ts.TypeChecker} checker Type checker.
 * @returns {Map<ts.Symbol, string>} Each rejected symbol with the reason reported for it.
 */
function collectTargets(program: ts.Program, checker: ts.TypeChecker): Map<ts.Symbol, string> {
 const targets: Map<ts.Symbol, string> = new Map();
 const sourceFile: ts.SourceFile | undefined = program.getSourceFile(TARGETS_PATH);

 const visit = (node: ts.Node): void => {
  if (ts.isStringLiteral(node) && ts.isImportDeclaration(node.parent)) {
   const symbol: ts.Symbol | undefined = resolveSymbol(checker, node);

   if (symbol) targets.set(symbol, `${node.text} module`);
  }

  if (ts.isArrayLiteralExpression(node)) {
   for (const element of node.elements) {
    const reference: ts.Node = ts.isPropertyAccessExpression(element) ? element.name : element;
    const symbol: ts.Symbol | undefined = resolveSymbol(checker, reference);

    // consoleModule and nodeConsoleModule resolve to the same export of the console module
    if (symbol) {
     targets.set(
      symbol,
      ts.isIdentifier(element) && element.text !== "console"
       ? "console module"
       : element.getText(sourceFile),
     );
    }
   }
  }

  ts.forEachChild(node, visit);
 };

 if (sourceFile) visit(sourceFile);
 expect([...new Set(targets.values())].sort(), "every logging target resolves").toEqual(
  expect.arrayContaining([
   "console",
   "console module",
   "node:console module",
   "process.emitWarning",
   "process.stderr",
   "process.stdout",
  ]),
 );

 return targets;
}

/**
 * Tells whether an identifier sits in a type position or an import, which never logs.
 * @param {ts.Identifier} node Identifier.
 * @returns {boolean} True for type annotations, type arguments and import specifiers.
 */
function isTypeOrImport(node: ts.Identifier): boolean {
 for (let current: ts.Node = node; !ts.isSourceFile(current); current = current.parent) {
  // isTypeNode also matches an extends clause, which uses the class as a value
  if (ts.isExpressionWithTypeArguments(current) && ts.isHeritageClause(current.parent)) {
   return current.parent.token === ts.SyntaxKind.ImplementsKeyword;
  }

  if (
   ts.isTypeNode(current) ||
   ts.isImportDeclaration(current) ||
   ts.isExportDeclaration(current)
  ) {
   return true;
  }
 }

 return false;
}

/**
 * Finds every direct logging path outside LoggerUtility: a NestJS Logger or ConsoleLogger used as a value (new,
 * static calls such as Logger.log, extends, passing the class around), and any reference whose symbol is Node's
 * process.stdout, process.stderr or process.emitWarning, the global console or the console module. Symbols are resolved with the type
 * checker, so imports, renames, aliases, destructuring, element access and globalThis count too.
 * @param {Record<string, string>} [injected] Extra source files by absolute path, used to prove that each pattern is found.
 * @returns {Array<string>} One "file: reason" entry per finding.
 */
function findDirectLogging(injected: Record<string, string> = {}): Array<string> {
 const configPath: string = path.resolve("tsconfig.json");
 const config: ts.ParsedCommandLine = ts.parseJsonConfigFileContent(
  ts.readConfigFile(configPath, ts.sys.readFile).config,
  ts.sys,
  path.dirname(configPath),
 );
 const host: ts.CompilerHost = ts.createCompilerHost(config.options);
 const getSourceFile: ts.CompilerHost["getSourceFile"] = host.getSourceFile.bind(host);
 const fileExists: ts.CompilerHost["fileExists"] = host.fileExists.bind(host);

 injected = { ...injected, [TARGETS_PATH]: TARGETS_SOURCE };
 host.fileExists = (fileName: string): boolean => fileName in injected || fileExists(fileName);
 host.getSourceFile = (fileName: string, languageVersion, ...rest) =>
  fileName in injected
   ? ts.createSourceFile(fileName, injected[fileName] ?? "", languageVersion, true)
   : getSourceFile(fileName, languageVersion, ...rest);

 const program: ts.Program = ts.createProgram({
  host,
  options: { ...config.options, noEmit: true },
  rootNames: [...listSources(SOURCE_ROOT), ...Object.keys(injected), TARGETS_PATH],
 });
 const checker: ts.TypeChecker = program.getTypeChecker();
 const targets: Map<ts.Symbol, string> = collectTargets(program, checker);
 const findings: Array<string> = [];

 for (const sourceFile of program.getSourceFiles()) {
  const fileName: string = path.resolve(sourceFile.fileName);

  if (!fileName.startsWith(`${SOURCE_ROOT}${path.sep}`) || fileName === LOGGER_UTILITY_PATH) {
   continue;
  }

  const report = (node: ts.Node, reason: string): void => {
   const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

   findings.push(`${path.relative(SOURCE_ROOT, fileName)}:${line + 1}: ${reason}`);
  };

  const visit = (node: ts.Node): void => {
   if (ts.isIdentifier(node) && !isTypeOrImport(node)) {
    const isNestLogger: boolean = (resolveSymbol(checker, node)?.declarations ?? []).some(
     (declaration: ts.Declaration) =>
      declaration.getSourceFile().fileName.includes("/node_modules/@nestjs/common/") &&
      ts.isClassDeclaration(declaration) &&
      NEST_LOGGERS.has(declaration.name?.text ?? ""),
    );

    if (isNestLogger) report(node, `NestJS ${node.text} used as a value`);
   }

   // Identifiers, element access keys such as process["stderr"] and module specifiers, by the symbol they resolve to
   if (
    (ts.isIdentifier(node) ||
     (ts.isStringLiteral(node) &&
      (ts.isElementAccessExpression(node.parent) ||
       ts.isImportDeclaration(node.parent) ||
       ts.isExportDeclaration(node.parent) ||
       ts.isCallExpression(node.parent)))) &&
    !isInTypePosition(node)
   ) {
    const symbol: ts.Symbol | undefined = resolveSymbol(checker, node);
    const reason: string | undefined = symbol ? targets.get(symbol) : undefined;

    if (reason) report(node, reason);
   }

   // const { stdout } = process binds the property without naming it at a reference
   if (ts.isBindingElement(node) && ts.isObjectBindingPattern(node.parent)) {
    const reason: string | undefined = targets.get(
     checker
      .getTypeAtLocation(node.parent)
      .getProperty((node.propertyName ?? node.name).getText(sourceFile)) as ts.Symbol,
    );

    if (reason) report(node, reason);
   }

   ts.forEachChild(node, visit);
  };

  visit(sourceFile);
 }

 return findings;
}

/**
 * Builds the absolute path of an injected source file.
 * @param {string} name File name without extension.
 * @returns {string} The path inside src.
 */
function injectedPath(name: string): string {
 return path.join(SOURCE_ROOT, "__injected__", `${name}.ts`);
}

const INJECTED_PATTERNS: Record<string, string> = {
 "aliased-new-logger": `import { Logger as NestLogger } from "@nestjs/common";\nexport const logger = new NestLogger("x");\n`,
 "extends-console-logger": `import { ConsoleLogger } from "@nestjs/common";\nexport class Custom extends ConsoleLogger {}\n`,
 "global-console-error": `console.error("x");\n`,
 "global-console-log": `console.log("x");\n`,
 "global-this-console": `globalThis.console.warn("x");\n`,
 "new-console-logger": `import { ConsoleLogger } from "@nestjs/common";\nexport const logger = new ConsoleLogger("x");\n`,
 "new-logger": `import { Logger } from "@nestjs/common";\nexport const logger = new Logger("x");\n`,
 "process-stderr": `process.stderr.write("x");\n`,
 "process-stdout": `process.stdout.write("x");\n`,
 "static-logger-debug": `import { Logger } from "@nestjs/common";\nLogger.debug("x");\n`,
 "static-logger-error": `import { Logger } from "@nestjs/common";\nLogger.error("x");\n`,
 "static-logger-log": `import { Logger } from "@nestjs/common";\nLogger.log("x");\n`,
 "static-logger-verbose": `import { Logger } from "@nestjs/common";\nLogger.verbose("x");\n`,
 "static-logger-warn": `import { Logger } from "@nestjs/common";\nLogger.warn("x");\n`,
 "console-alias": `const out = console;\nout.info("x");\n`,
 "console-module-named": `import { warn } from "console";\nwarn("x");\n`,
 "destructured-process-stdout": `const { stdout } = process;\nstdout.write("x");\n`,
 "dynamic-node-console": `const { log } = await import("node:console");\nlog("x");\n`,
 "dynamic-node-process": `const { stderr } = await import("node:process");\nstderr.write("x");\n`,
 "global-this-console-element": `globalThis["console"].log("x");\n`,
 "global-this-process": `globalThis.process.stdout.write("x");\n`,
 "node-console-default": `import nodeConsole from "node:console";\nnodeConsole.log("x");\n`,
 "node-console-named": `import { log } from "node:console";\nlog("x");\n`,
 "node-process-default": `import proc from "node:process";\nproc.stdout.write("x");\n`,
 "node-process-named": `import { stdout } from "node:process";\nstdout.write("x");\n`,
 "node-process-namespace": `import * as proc from "node:process";\nproc.stderr.write("x");\n`,
 "process-alias": `const p = process;\np.stderr.write("x");\n`,
 "process-element-access": `process["stderr"].write("x");\n`,
 "renamed-destructured-process-stderr": `const { stderr: errors } = process;\nerrors.write("x");\n`,
 "node-console-mixed-type-import": `import { type Console, log } from "node:console";\nlog("x");\n`,
 "node-console-reexport": `export { log } from "node:console";\n`,
 "process-emit-warning": `process.emitWarning("x");\n`,
 "process-emit-warning-destructured": `const { emitWarning } = process;\nemitWarning("x");\n`,
 "process-emit-warning-element": `process["emitWarning"]("x");\n`,
 "process-emit-warning-global-this": `globalThis.process.emitWarning("x");\n`,
 "process-emit-warning-named": `import { emitWarning } from "node:process";\nemitWarning("x");\n`,
};

describe("package logging", () => {
 afterEach(() => {
  delete process.env.NCC_LOG_LEVEL;
  vi.restoreAllMocks();
 });

 describe("direct logging paths", () => {
  // One program for the source tree plus every injected pattern keeps the type checker run to one
  const findings: Array<string> = findDirectLogging({
   ...Object.fromEntries(
    Object.entries(INJECTED_PATTERNS).map(([name, source]) => [injectedPath(name), source]),
   ),
   [injectedPath("type-only")]:
    `import type { ConsoleLogger, Logger } from "@nestjs/common";\nexport type Loggers = ConsoleLogger | Logger;\nexport const name: string = "process";\n`,
   [injectedPath("type-only-console")]:
    `import type { Console } from "node:console";\nexport type ConsoleClass = typeof Console;\n`,
   [injectedPath("type-only-stdout")]:
    `import type { stdout } from "node:process";\nexport type Stdout = typeof stdout;\n`,
   [injectedPath("type-only-inline")]:
    `import { type Console } from "node:console";\nexport type ConsoleClass = typeof Console;\n`,
   [injectedPath("type-only-reexport")]: `export type { Console } from "node:console";\n`,
   // Same names on other symbols: a guard that matches by spelling flags these
   [injectedPath("same-names")]:
    `const streams = { stderr: "", stdout: "" };\nconst console = { log: (value: string): string => value };\nexport const values: Array<string> = [streams.stdout, streams["stderr"], console.log("x")];\n`,
  });

  it("logs only through LoggerUtility in the package sources", () => {
   expect(findings.filter((finding: string) => !finding.startsWith("__injected__"))).toEqual([]);
  });

  it.each(Object.keys(INJECTED_PATTERNS))("fails when %s is injected", (name: string) => {
   expect(findings.some((finding: string) => finding.startsWith(`__injected__/${name}.ts:`))).toBe(
    true,
   );
  });

  it("allows NestJS logger types", () => {
   expect(
    findings.filter((finding: string) => finding.startsWith("__injected__/type-only.ts:")),
   ).toEqual([]);
  });

  it.each(["console", "stdout", "inline", "reexport"])(
   "allows the type-only %s import of a logging module",
   (name: string) => {
    expect(
     findings.filter((finding: string) => finding.startsWith(`__injected__/type-only-${name}.ts:`)),
    ).toEqual([]);
   },
  );

  it("allows other symbols named console, stdout or stderr", () => {
   expect(
    findings.filter((finding: string) => finding.startsWith("__injected__/same-names")),
   ).toEqual([]);
  });
 });

 it("gives every migration service a LoggerUtility", () => {
  const migrationService: ConfigMigrationService = new ConfigMigrationService(
   {} as DataSource,
   {},
   {} as CrudConfigService,
   {} as ApiServiceBase<IConfigMigration>,
  );
  const runnerService: ConfigMigrationRunnerService = new ConfigMigrationRunnerService(
   migrationService,
   {},
  );

  expect((migrationService as unknown as { LOGGER: unknown }).LOGGER).toBeInstanceOf(LoggerUtility);
  expect((runnerService as unknown as { LOGGER: unknown }).LOGGER).toBeInstanceOf(LoggerUtility);
 });

 it("prints nothing from the migration service when NCC_LOG_LEVEL is unset", async () => {
  delete process.env.NCC_LOG_LEVEL;
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  const migrationService: ConfigMigrationService = new ConfigMigrationService(
   {} as DataSource,
   { migrationOptions: { isEnabled: true } },
   {} as CrudConfigService,
   {
    getList: vi.fn().mockRejectedValue(new Error("history unavailable")),
   } as unknown as ApiServiceBase<IConfigMigration>,
  );

  migrationService.onModuleInit();
  await migrationService.cleanupFailedMigrations().catch(() => undefined);
  await migrationService.executeMigrations([]).catch(() => undefined);

  expect(stdout).not.toHaveBeenCalled();
  expect(stderr).not.toHaveBeenCalled();
 });

 it("prints migration service logs when NCC_LOG_LEVEL enables them", () => {
  process.env.NCC_LOG_LEVEL = "log";
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const migrationService: ConfigMigrationService = new ConfigMigrationService(
   {} as DataSource,
   {},
   {} as CrudConfigService,
   {} as ApiServiceBase<IConfigMigration>,
  );

  migrationService.onModuleInit();

  expect(stdout.mock.calls.map((call) => String(call[0])).join("")).toContain(
   "Migration service initialized",
  );
 });
});
