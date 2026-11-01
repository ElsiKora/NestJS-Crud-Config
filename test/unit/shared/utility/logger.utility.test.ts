import type { LogLevel } from "@nestjs/common";

import { LoggerUtility } from "../../../../src/shared/utility/logger.utility";
import { afterEach, describe, expect, it } from "vitest";

const getLevels = (): Array<LogLevel> =>
 (LoggerUtility as unknown as { getLogLevelsFromEnv: () => Array<LogLevel> }).getLogLevelsFromEnv();

describe("LoggerUtility", () => {
 afterEach(() => {
  delete process.env.NCC_LOG_LEVEL;
 });

 it("reads NCC_LOG_LEVEL at the first message, after the application set it", () => {
  delete process.env.NCC_LOG_LEVEL;
  // Package loggers are created with their services, before the application may have loaded .env
  const logger: LoggerUtility = LoggerUtility.getLogger("Lazy");

  process.env.NCC_LOG_LEVEL = "debug";

  expect(logger.isLevelEnabled("debug")).toBe(true);
  expect(logger.isLevelEnabled("verbose")).toBe(false);
 });

 it("keeps the levels of the first message and lets setLogLevels override them", () => {
  process.env.NCC_LOG_LEVEL = "error";
  const logger: LoggerUtility = LoggerUtility.getLogger("Resolved");

  expect(logger.isLevelEnabled("warn")).toBe(false);
  process.env.NCC_LOG_LEVEL = "debug";
  expect(logger.isLevelEnabled("debug")).toBe(false);

  const explicitLogger: LoggerUtility = LoggerUtility.getLogger("Explicit");

  explicitLogger.setLogLevels(["warn"]);
  expect(explicitLogger.isLevelEnabled("warn")).toBe(true);
  expect(explicitLogger.isLevelEnabled("debug")).toBe(false);
 });

 it("returns log levels based on environment variable", () => {
  process.env.NCC_LOG_LEVEL = "debug";
  expect(getLevels()).toEqual(["error", "warn", "log", "debug"]);

  process.env.NCC_LOG_LEVEL = "warn";
  expect(getLevels()).toEqual(["error", "warn"]);

  process.env.NCC_LOG_LEVEL = "unknown";
  expect(getLevels()).toEqual(["error", "warn", "log"]);

  delete process.env.NCC_LOG_LEVEL;
  expect(getLevels()).toEqual([]);
 });

 it("creates loggers with namespaced context", () => {
  const logger: LoggerUtility = LoggerUtility.getLogger("Test");

  expect(logger).toBeInstanceOf(LoggerUtility);
  expect((logger as unknown as { context?: string }).context).toBe("NestJS-Crud-Config/Test");
 });
});
