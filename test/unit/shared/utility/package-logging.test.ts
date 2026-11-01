import type { ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import type { DataSource } from "typeorm";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { CrudConfigService } from "../../../../src/modules/config/config.service";
import { ConfigMigrationRunnerService } from "../../../../src/modules/config/migration/migration-runner.service";
import { ConfigMigrationService } from "../../../../src/modules/config/migration/migration.service";
import type { IConfigMigration } from "../../../../src/modules/config/migration/interface";
import { LoggerUtility } from "../../../../src/shared/utility/logger.utility";

const SOURCE_ROOT: string = path.resolve("src");
const LOGGER_UTILITY_PATH: string = path.join(SOURCE_ROOT, "shared/utility/logger.utility.ts");

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

describe("package logging", () => {
 afterEach(() => {
  delete process.env.NCC_LOG_LEVEL;
  vi.restoreAllMocks();
 });

 it("creates NestJS loggers only inside LoggerUtility", () => {
  const offenders: Array<string> = listSources(SOURCE_ROOT)
   .filter((filePath: string) => filePath !== LOGGER_UTILITY_PATH)
   .filter((filePath: string) =>
    /\bnew\s+(?:Console)?Logger\s*\(/.test(readFileSync(filePath, "utf8")),
   )
   .map((filePath: string) => path.relative(SOURCE_ROOT, filePath));

  expect(offenders).toEqual([]);
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
