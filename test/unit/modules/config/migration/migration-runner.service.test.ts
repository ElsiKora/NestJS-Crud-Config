import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigMigrationRunnerService } from "../../../../../src/modules/config/migration/migration-runner.service";
import { ConfigMigrationService } from "../../../../../src/modules/config/migration/migration.service";
import { EConfigMigrationStatus } from "../../../../../src/modules/config/migration/enum";
import type {
 IConfigMigration,
 IConfigMigrationDefinition,
} from "../../../../../src/modules/config/migration/interface";
import { CONFIG_MIGRATION_CONSTANT } from "../../../../../src/shared/constant/config";
import type { IConfigOptions } from "../../../../../src/shared/interface/config";

describe("ConfigMigrationRunnerService", () => {
 let service: ConfigMigrationRunnerService;
 let mockMigrationService: ConfigMigrationService;
 let mockOptions: IConfigOptions;

 const mockMigrationDefinition: IConfigMigrationDefinition = {
  name: "001_test_migration",
  description: "Test migration",
  up: vi.fn().mockResolvedValue(undefined),
  down: vi.fn().mockResolvedValue(undefined),
 };

 const mockFailedMigration: IConfigMigration = {
  id: "failed-1",
  name: "001_failed_migration",
  status: EConfigMigrationStatus.FAILED,
  createdAt: new Date(),
  updatedAt: new Date(),
  startedAt: new Date(),
  failedAt: new Date(),
 };

 beforeEach(() => {
  vi.clearAllMocks();

  mockMigrationService = {
   getExecutedMigrations: vi.fn(),
   cleanupStuckMigrations: vi.fn(),
   executeMigrations: vi.fn(),
  } as any;

  mockOptions = {
   environment: "test",
   migrationOptions: {
    isEnabled: true,
    shouldRunOnStartup: true,
    migrations: [mockMigrationDefinition],
    stuckMigrationTimeoutMinutes: 30,
   },
  };

  service = new ConfigMigrationRunnerService(mockMigrationService, mockOptions);

  // Mock console logger
  vi.spyOn(service["LOGGER"], "verbose").mockImplementation(() => {});
  vi.spyOn(service["LOGGER"], "warn").mockImplementation(() => {});
  vi.spyOn(service["LOGGER"], "error").mockImplementation(() => {});
 });

 describe("onApplicationBootstrap", () => {
  it("should run migrations on application startup", async () => {
   vi.mocked(mockMigrationService.getExecutedMigrations).mockResolvedValue([]);
   vi.mocked(mockMigrationService.cleanupStuckMigrations).mockResolvedValue();
   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.onApplicationBootstrap();

   expect(mockMigrationService.getExecutedMigrations).toHaveBeenCalled();
   expect(mockMigrationService.cleanupStuckMigrations).toHaveBeenCalledWith(30);
   expect(mockMigrationService.executeMigrations).toHaveBeenCalledWith(
    [mockMigrationDefinition],
    true,
   );
  });

  it("should skip migrations when disabled", async () => {
   mockOptions.migrationOptions!.isEnabled = false;

   await service.onApplicationBootstrap();

   expect(mockMigrationService.getExecutedMigrations).not.toHaveBeenCalled();
   expect(mockMigrationService.cleanupStuckMigrations).not.toHaveBeenCalled();
   expect(mockMigrationService.executeMigrations).not.toHaveBeenCalled();
  });

  it("should skip migrations when shouldRunOnStartup is false", async () => {
   mockOptions.migrationOptions!.shouldRunOnStartup = false;

   await service.onApplicationBootstrap();

   expect(mockMigrationService.getExecutedMigrations).not.toHaveBeenCalled();
   expect(mockMigrationService.cleanupStuckMigrations).not.toHaveBeenCalled();
   expect(mockMigrationService.executeMigrations).not.toHaveBeenCalled();
  });

  it("should skip migrations when no migrations configured", async () => {
   mockOptions.migrationOptions!.migrations = [];

   await service.onApplicationBootstrap();

   expect(mockMigrationService.getExecutedMigrations).not.toHaveBeenCalled();
   expect(mockMigrationService.cleanupStuckMigrations).not.toHaveBeenCalled();
   expect(mockMigrationService.executeMigrations).not.toHaveBeenCalled();
  });

  it("should skip migrations when migrations is undefined", async () => {
   mockOptions.migrationOptions!.migrations = undefined;

   await service.onApplicationBootstrap();

   expect(mockMigrationService.getExecutedMigrations).not.toHaveBeenCalled();
   expect(mockMigrationService.cleanupStuckMigrations).not.toHaveBeenCalled();
   expect(mockMigrationService.executeMigrations).not.toHaveBeenCalled();
  });

  it("should warn about failed migrations from previous runs", async () => {
   vi.mocked(mockMigrationService.getExecutedMigrations).mockResolvedValue([mockFailedMigration]);
   vi.mocked(mockMigrationService.cleanupStuckMigrations).mockResolvedValue();
   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.onApplicationBootstrap();

   expect(service["LOGGER"].warn).toHaveBeenCalledWith(
    "Found 1 failed migration(s) from previous runs: 001_failed_migration",
   );
   expect(service["LOGGER"].warn).toHaveBeenCalledWith(
    "Consider reviewing and cleaning up failed migrations before proceeding",
   );
  });

  it("should use default stuck migration timeout", async () => {
   mockOptions.migrationOptions!.stuckMigrationTimeoutMinutes = undefined;

   vi.mocked(mockMigrationService.getExecutedMigrations).mockResolvedValue([]);
   vi.mocked(mockMigrationService.cleanupStuckMigrations).mockResolvedValue();
   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.onApplicationBootstrap();

   expect(mockMigrationService.cleanupStuckMigrations).toHaveBeenCalledWith(
    CONFIG_MIGRATION_CONSTANT.DEFAULT_STUCK_MIGRATION_TIMEOUT_MINUTES,
   );
  });

  it("should use default useTransaction when not specified", async () => {
   mockOptions.migrationOptions!.useTransaction = undefined;

   vi.mocked(mockMigrationService.getExecutedMigrations).mockResolvedValue([]);
   vi.mocked(mockMigrationService.cleanupStuckMigrations).mockResolvedValue();
   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.onApplicationBootstrap();

   expect(mockMigrationService.executeMigrations).toHaveBeenCalledWith(
    [mockMigrationDefinition],
    true,
   );
  });

  it("should use configured useTransaction value", async () => {
   mockOptions.migrationOptions!.useTransaction = false;

   vi.mocked(mockMigrationService.getExecutedMigrations).mockResolvedValue([]);
   vi.mocked(mockMigrationService.cleanupStuckMigrations).mockResolvedValue();
   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.onApplicationBootstrap();

   expect(mockMigrationService.executeMigrations).toHaveBeenCalledWith(
    [mockMigrationDefinition],
    false,
   );
  });

  it("should handle errors during migration execution", async () => {
   const error = new Error("Migration execution failed");

   vi.mocked(mockMigrationService.getExecutedMigrations).mockResolvedValue([]);
   vi.mocked(mockMigrationService.cleanupStuckMigrations).mockResolvedValue();
   vi.mocked(mockMigrationService.executeMigrations).mockRejectedValue(error);

   await expect(service.onApplicationBootstrap()).rejects.toThrow(error);

   expect(service["LOGGER"].error).toHaveBeenCalledWith("Migration runner failed:", error);
  });

  it("should handle errors during cleanup", async () => {
   const error = new Error("Cleanup failed");

   vi.mocked(mockMigrationService.getExecutedMigrations).mockResolvedValue([]);
   vi.mocked(mockMigrationService.cleanupStuckMigrations).mockRejectedValue(error);

   await expect(service.onApplicationBootstrap()).rejects.toThrow(error);

   expect(service["LOGGER"].error).toHaveBeenCalledWith("Migration runner failed:", error);
  });

  it("should handle errors during getting executed migrations", async () => {
   const error = new Error("Failed to get executed migrations");

   vi.mocked(mockMigrationService.getExecutedMigrations).mockRejectedValue(error);

   await expect(service.onApplicationBootstrap()).rejects.toThrow(error);

   expect(service["LOGGER"].error).toHaveBeenCalledWith("Migration runner failed:", error);
  });

  it("should handle when migrationOptions is undefined", async () => {
   mockOptions.migrationOptions = undefined;

   await service.onApplicationBootstrap();

   expect(mockMigrationService.getExecutedMigrations).not.toHaveBeenCalled();
   expect(mockMigrationService.cleanupStuckMigrations).not.toHaveBeenCalled();
   expect(mockMigrationService.executeMigrations).not.toHaveBeenCalled();
  });

  it("should log completion message", async () => {
   vi.mocked(mockMigrationService.getExecutedMigrations).mockResolvedValue([]);
   vi.mocked(mockMigrationService.cleanupStuckMigrations).mockResolvedValue();
   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.onApplicationBootstrap();

   expect(service["LOGGER"].verbose).toHaveBeenCalledWith(
    "Migration runner completed successfully",
   );
  });
 });

 describe("runMigrations", () => {
  it("should run migrations manually", async () => {
   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.runMigrations();

   expect(mockMigrationService.executeMigrations).toHaveBeenCalledWith(
    [mockMigrationDefinition],
    true,
   );
  });

  it("should throw error when migrations are not enabled", async () => {
   mockOptions.migrationOptions!.isEnabled = false;

   await expect(service.runMigrations()).rejects.toThrow("Migrations are not enabled");

   expect(mockMigrationService.executeMigrations).not.toHaveBeenCalled();
  });

  it("should throw error when no migrations configured", async () => {
   mockOptions.migrationOptions!.migrations = [];

   await expect(service.runMigrations()).rejects.toThrow("No migrations configured");

   expect(mockMigrationService.executeMigrations).not.toHaveBeenCalled();
  });

  it("should throw error when migrations is undefined", async () => {
   mockOptions.migrationOptions!.migrations = undefined;

   await expect(service.runMigrations()).rejects.toThrow("No migrations configured");

   expect(mockMigrationService.executeMigrations).not.toHaveBeenCalled();
  });

  it("should throw error when migrationOptions is undefined", async () => {
   mockOptions.migrationOptions = undefined;

   await expect(service.runMigrations()).rejects.toThrow("Migrations are not enabled");

   expect(mockMigrationService.executeMigrations).not.toHaveBeenCalled();
  });

  it("should use configured useTransaction value", async () => {
   mockOptions.migrationOptions!.useTransaction = false;

   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.runMigrations();

   expect(mockMigrationService.executeMigrations).toHaveBeenCalledWith(
    [mockMigrationDefinition],
    false,
   );
  });

  it("should use default useTransaction when not specified", async () => {
   mockOptions.migrationOptions!.useTransaction = undefined;

   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.runMigrations();

   expect(mockMigrationService.executeMigrations).toHaveBeenCalledWith(
    [mockMigrationDefinition],
    true,
   );
  });

  it("should propagate errors from executeMigrations", async () => {
   const error = new Error("Migration execution failed");

   vi.mocked(mockMigrationService.executeMigrations).mockRejectedValue(error);

   await expect(service.runMigrations()).rejects.toThrow(error);
  });
 });

 describe("multiple failed migrations", () => {
  it("should handle multiple failed migrations", async () => {
   const failedMigrations = [
    mockFailedMigration,
    {
     ...mockFailedMigration,
     id: "failed-2",
     name: "002_failed_migration",
    },
   ];

   vi.mocked(mockMigrationService.getExecutedMigrations).mockResolvedValue(failedMigrations);
   vi.mocked(mockMigrationService.cleanupStuckMigrations).mockResolvedValue();
   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.onApplicationBootstrap();

   expect(service["LOGGER"].warn).toHaveBeenCalledWith(
    "Found 2 failed migration(s) from previous runs: 001_failed_migration, 002_failed_migration",
   );
  });
 });

 describe("mixed migration statuses", () => {
  it("should only warn about failed migrations", async () => {
   const mixedMigrations = [
    mockFailedMigration,
    {
     ...mockFailedMigration,
     id: "completed-1",
     name: "001_completed_migration",
     status: EConfigMigrationStatus.COMPLETED,
    },
    {
     ...mockFailedMigration,
     id: "running-1",
     name: "002_running_migration",
     status: EConfigMigrationStatus.RUNNING,
    },
   ];

   vi.mocked(mockMigrationService.getExecutedMigrations).mockResolvedValue(mixedMigrations);
   vi.mocked(mockMigrationService.cleanupStuckMigrations).mockResolvedValue();
   vi.mocked(mockMigrationService.executeMigrations).mockResolvedValue();

   await service.onApplicationBootstrap();

   expect(service["LOGGER"].warn).toHaveBeenCalledWith(
    "Found 1 failed migration(s) from previous runs: 001_failed_migration",
   );
  });
 });
});
