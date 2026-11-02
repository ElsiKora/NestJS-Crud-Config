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
const PROCESS_STREAMS: ReadonlySet<string> = new Set(["stderr", "stdout"]);

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
 * Resolves an identifier to the declarations of the symbol it refers to, through import aliases.
 * @param {ts.TypeChecker} checker Type checker.
 * @param {ts.Identifier} node Identifier.
 * @returns {Array<ts.Declaration>} The declarations, empty for an unresolved name.
 */
function getDeclarations(checker: ts.TypeChecker, node: ts.Identifier): Array<ts.Declaration> {
 let symbol: ts.Symbol | undefined = checker.getSymbolAtLocation(node);

 if (symbol && symbol.flags & ts.SymbolFlags.Alias) {
  symbol = checker.getAliasedSymbol(symbol);
 }

 return symbol?.declarations ?? [];
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
 * static calls such as Logger.log, extends, passing the class around), the global console and process.stdout or
 * process.stderr. Names are resolved with the type checker, so aliased imports and globalThis access count too.
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

 host.fileExists = (fileName: string): boolean => fileName in injected || fileExists(fileName);
 host.getSourceFile = (fileName: string, languageVersion, ...rest) =>
  fileName in injected
   ? ts.createSourceFile(fileName, injected[fileName] ?? "", languageVersion, true)
   : getSourceFile(fileName, languageVersion, ...rest);

 const program: ts.Program = ts.createProgram({
  host,
  options: { ...config.options, noEmit: true },
  rootNames: [...listSources(SOURCE_ROOT), ...Object.keys(injected)],
 });
 const checker: ts.TypeChecker = program.getTypeChecker();
 const findings: Array<string> = [];

 for (const sourceFile of program.getSourceFiles()) {
  const fileName: string = path.resolve(sourceFile.fileName);

  if (!fileName.startsWith(`${SOURCE_ROOT}${path.sep}`) || fileName === LOGGER_UTILITY_PATH) {
   continue;
  }

  const visit = (node: ts.Node): void => {
   if (ts.isIdentifier(node) && !isTypeOrImport(node)) {
    const declarations: Array<ts.Declaration> = getDeclarations(checker, node);
    const isExternal: boolean =
     declarations.length > 0 &&
     declarations.every((declaration: ts.Declaration) =>
      declaration.getSourceFile().fileName.includes("/node_modules/"),
     );
    const isNestLogger: boolean = declarations.some(
     (declaration: ts.Declaration) =>
      declaration.getSourceFile().fileName.includes("/node_modules/@nestjs/common/") &&
      ts.isClassDeclaration(declaration) &&
      NEST_LOGGERS.has(declaration.name?.text ?? ""),
    );
    const reason: string | undefined = isNestLogger
     ? `NestJS ${node.text} used as a value`
     : isExternal && node.text === "console"
       ? "global console"
       : isExternal &&
           node.text === "process" &&
           ts.isPropertyAccessExpression(node.parent) &&
           node.parent.expression === node &&
           PROCESS_STREAMS.has(node.parent.name.text)
         ? `process.${node.parent.name.text}`
         : undefined;

    if (reason) {
     const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());

     findings.push(`${path.relative(SOURCE_ROOT, fileName)}:${line + 1}: ${reason}`);
    }
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
    findings.filter((finding: string) => finding.startsWith("__injected__/type-only")),
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
