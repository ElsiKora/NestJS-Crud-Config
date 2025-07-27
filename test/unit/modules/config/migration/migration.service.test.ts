import { ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import { Logger } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CrudConfigService } from "../../../../../src/modules/config/config.service";
import { ConfigMigrationService } from "../../../../../src/modules/config/migration/migration.service";
import { EConfigMigrationStatus } from "../../../../../src/modules/config/migration/enum";
import type {
 IConfigMigration,
 IConfigMigrationDefinition,
} from "../../../../../src/modules/config/migration/interface";
import { CONFIG_MIGRATION_CONSTANT } from "../../../../../src/shared/constant/config";
import type { IConfigOptions } from "../../../../../src/shared/interface/config";

describe("ConfigMigrationService", () => {
 let service: ConfigMigrationService;
 let mockDataSource: DataSource;
 let mockConfigService: CrudConfigService;
 let mockOptions: IConfigOptions;
 let mockMigrationService: ApiServiceBase<IConfigMigration>;
 let mockEntityManager: EntityManager;

 const mockMigration: IConfigMigration = {
  id: "migration-1",
  name: "001_test_migration",
  status: EConfigMigrationStatus.COMPLETED,
  createdAt: new Date(),
  updatedAt: new Date(),
  startedAt: new Date(),
  executedAt: new Date(),
 };

 const mockMigrationDefinition: IConfigMigrationDefinition = {
  name: "001_test_migration",
  description: "Test migration",
  up: vi.fn().mockResolvedValue(undefined),
  down: vi.fn().mockResolvedValue(undefined),
 };

 const createMockApiListResult = <T>(items: T[], totalCount?: number) => ({
  count: totalCount || items.length,
  items,
  currentPage: 1,
  totalCount: totalCount || items.length,
  totalPages: Math.ceil((totalCount || items.length) / 10),
 });

 beforeEach(() => {
  vi.clearAllMocks();

  mockMigrationService = {
   get: vi.fn(),
   getList: vi.fn(),
   create: vi.fn(),
   update: vi.fn(),
   delete: vi.fn(),
  } as any;

  mockEntityManager = {
   transaction: vi.fn(),
  } as any;

  mockDataSource = {
   transaction: vi.fn(),
   createQueryRunner: vi.fn(),
  } as any;

  mockConfigService = {} as any;

  mockOptions = {
   environment: "test",
   migrationOptions: {
    tableName: "test_migrations",
    stuckMigrationTimeoutMinutes: 30,
   },
   entityOptions: {
    tablePrefix: "test_",
   },
  };

  service = new ConfigMigrationService(
   mockDataSource,
   mockOptions,
   mockConfigService,
   mockMigrationService,
  );

  // Mock onModuleInit - it should be a no-op in our tests
  service.onModuleInit();

  // Mock logger
  const mockLogger: Logger = {
   log: vi.fn(),
   error: vi.fn(),
   warn: vi.fn(),
   debug: vi.fn(),
   verbose: vi.fn(),
  } as any;
  vi.spyOn(service["LOGGER"], "verbose").mockImplementation(() => {});
  vi.spyOn(service["LOGGER"], "warn").mockImplementation(() => {});
  vi.spyOn(service["LOGGER"], "error").mockImplementation(() => {});
 });

 describe("executeMigrations", () => {
  it("should execute pending migrations successfully", async () => {
   const migrations = [mockMigrationDefinition];

   vi.mocked(mockMigrationService.getList).mockResolvedValue(createMockApiListResult([]));

   vi.mocked(mockMigrationService.create).mockResolvedValue(mockMigration);
   vi.mocked(mockMigrationService.update).mockResolvedValue(mockMigration);

   vi.mocked(mockDataSource.transaction).mockImplementation(async (callback: any) => {
    return await callback(mockEntityManager);
   });

   await service.executeMigrations(migrations, true);

   expect(mockMigrationDefinition.up).toHaveBeenCalledWith(mockConfigService, mockEntityManager);
   expect(mockMigrationService.create).toHaveBeenCalledWith(
    expect.objectContaining({
     name: "001_test_migration",
     status: EConfigMigrationStatus.RUNNING,
    }),
    mockEntityManager,
   );
   expect(mockMigrationService.update).toHaveBeenCalledWith(
    expect.objectContaining({ id: "migration-1" }),
    expect.objectContaining({
     status: EConfigMigrationStatus.COMPLETED,
    }),
    mockEntityManager,
   );
  });

  it("should skip already completed migrations", async () => {
   const migrations = [mockMigrationDefinition];

   vi
    .mocked(mockMigrationService.getList)
    .mockResolvedValue(createMockApiListResult([mockMigration]));

   await service.executeMigrations(migrations, true);

   expect(mockMigrationDefinition.up).not.toHaveBeenCalled();
   expect(mockMigrationService.create).not.toHaveBeenCalled();
  });

  it("should handle migration execution failure", async () => {
   const migrations = [mockMigrationDefinition];
   const error = new Error("Migration failed");

   vi.mocked(mockMigrationService.getList).mockResolvedValue(createMockApiListResult([]));

   vi.mocked(mockMigrationService.create).mockResolvedValue(mockMigration);
   vi.mocked(mockMigrationDefinition.up).mockRejectedValue(error);

   vi.mocked(mockDataSource.transaction).mockImplementation(async (callback: any) => {
    return await callback(mockEntityManager);
   });

   await expect(service.executeMigrations(migrations, true)).rejects.toThrow(error);

   expect(mockMigrationService.update).toHaveBeenCalledWith(
    expect.objectContaining({ id: "migration-1" }),
    expect.objectContaining({
     status: EConfigMigrationStatus.FAILED,
    }),
    mockEntityManager,
   );
  });

  it("should validate migrations before execution", async () => {
   const invalidMigrations = [
    {
     name: "",
     up: vi.fn(),
    },
   ] as IConfigMigrationDefinition[];

   await expect(service.executeMigrations(invalidMigrations, true)).rejects.toThrow(
    "Migration names cannot be empty",
   );
  });

  it("should check for duplicate migration names", async () => {
   const duplicateMigrations = [mockMigrationDefinition, { ...mockMigrationDefinition }];

   await expect(service.executeMigrations(duplicateMigrations, true)).rejects.toThrow(
    "Duplicate migration names found",
   );
  });

  it("should execute migrations without transaction when useTransaction is false", async () => {
   const testMigration = {
    name: "001_test_migration",
    description: "Test migration",
    up: vi.fn().mockResolvedValue(undefined),
    down: vi.fn().mockResolvedValue(undefined),
   };
   const migrations = [testMigration];

   vi.mocked(mockMigrationService.getList).mockResolvedValue(createMockApiListResult([]));

   vi.mocked(mockMigrationService.create).mockResolvedValue(mockMigration);
   vi.mocked(mockMigrationService.update).mockResolvedValue(mockMigration);

   await service.executeMigrations(migrations, false);

   expect(mockDataSource.transaction).not.toHaveBeenCalled();
   expect(testMigration.up).toHaveBeenCalledWith(mockConfigService, undefined);
  });

  it("should handle race condition with unique constraint violation", async () => {
   const migrations = [mockMigrationDefinition];
   const uniqueError = new Error("duplicate key value violates unique constraint");

   vi.mocked(mockMigrationService.getList).mockResolvedValue(createMockApiListResult([]));

   vi.mocked(mockMigrationService.create).mockRejectedValue(uniqueError);

   vi.mocked(mockDataSource.transaction).mockImplementation(async (callback: any) => {
    return await callback(mockEntityManager);
   });

   await service.executeMigrations(migrations, true);

   expect(mockMigrationDefinition.up).not.toHaveBeenCalled();
  });
 });

 describe("rollbackMigration", () => {
  it("should rollback migration successfully", async () => {
   const migrationWithDown = {
    ...mockMigrationDefinition,
    down: vi.fn().mockResolvedValue(undefined),
   };

   vi.mocked(mockDataSource.transaction).mockImplementation(async (callback: any) => {
    return await callback(mockEntityManager);
   });

   await service.rollbackMigration("001_test_migration", [migrationWithDown]);

   expect(migrationWithDown.down).toHaveBeenCalledWith(mockConfigService, mockEntityManager);
   expect(mockMigrationService.delete).toHaveBeenCalledWith({
    name: "001_test_migration",
   });
  });

  it("should throw error when migration not found", async () => {
   await expect(
    service.rollbackMigration("non_existent_migration", [mockMigrationDefinition]),
   ).rejects.toThrow("Migration 'non_existent_migration' not found");
  });

  it("should throw error when migration has no down method", async () => {
   const migrationWithoutDown = {
    ...mockMigrationDefinition,
    down: undefined,
   };

   await expect(
    service.rollbackMigration("001_test_migration", [migrationWithoutDown]),
   ).rejects.toThrow("Migration '001_test_migration' does not have a down method");
  });

  it("should handle rollback failure", async () => {
   const migrationWithDown = {
    ...mockMigrationDefinition,
    down: vi.fn().mockRejectedValue(new Error("Rollback failed")),
   };

   vi.mocked(mockDataSource.transaction).mockImplementation(async (callback: any) => {
    return await callback(mockEntityManager);
   });

   await expect(
    service.rollbackMigration("001_test_migration", [migrationWithDown]),
   ).rejects.toThrow("Rollback failed");

   expect(mockMigrationService.delete).not.toHaveBeenCalled();
  });
 });

 describe("getExecutedMigrations", () => {
  it("should return list of executed migrations", async () => {
   const migrations = [mockMigration];

   vi.mocked(mockMigrationService.getList).mockResolvedValue(createMockApiListResult(migrations));

   const result = await service.getExecutedMigrations();

   expect(result).toEqual(migrations);
   expect(mockMigrationService.getList).toHaveBeenCalledWith({
    order: { name: "ASC" },
   });
  });

  it("should handle errors when getting executed migrations", async () => {
   const error = new Error("Database error");

   vi.mocked(mockMigrationService.getList).mockRejectedValue(error);

   await expect(service.getExecutedMigrations()).rejects.toThrow(error);
  });
 });

 describe("isMigrationExecuted", () => {
  it("should return true for executed migration", async () => {
   vi
    .mocked(mockMigrationService.getList)
    .mockResolvedValue(createMockApiListResult([mockMigration]));

   const result = await service.isMigrationExecuted("001_test_migration");

   expect(result).toBe(true);
   expect(mockMigrationService.getList).toHaveBeenCalledWith({
    where: { name: "001_test_migration" },
   });
  });

  it("should return false for non-executed migration", async () => {
   vi.mocked(mockMigrationService.getList).mockResolvedValue(createMockApiListResult([]));

   const result = await service.isMigrationExecuted("non_existent_migration");

   expect(result).toBe(false);
  });

  it("should return false for failed migration", async () => {
   const failedMigration = {
    ...mockMigration,
    status: EConfigMigrationStatus.FAILED,
   };

   vi
    .mocked(mockMigrationService.getList)
    .mockResolvedValue(createMockApiListResult([failedMigration]));

   const result = await service.isMigrationExecuted("001_test_migration");

   expect(result).toBe(false);
  });
 });

 describe("cleanupFailedMigrations", () => {
  it("should cleanup all failed migrations", async () => {
   const failedMigrations = [
    {
     ...mockMigration,
     id: "failed-1",
     status: EConfigMigrationStatus.FAILED,
    },
    {
     ...mockMigration,
     id: "failed-2",
     status: EConfigMigrationStatus.FAILED,
    },
   ];

   vi
    .mocked(mockMigrationService.getList)
    .mockResolvedValue(createMockApiListResult(failedMigrations));

   await service.cleanupFailedMigrations();

   expect(mockMigrationService.delete).toHaveBeenCalledTimes(2);
   expect(mockMigrationService.delete).toHaveBeenCalledWith({ id: "failed-1" });
   expect(mockMigrationService.delete).toHaveBeenCalledWith({ id: "failed-2" });
  });

  it("should cleanup specific failed migration", async () => {
   const failedMigration = {
    ...mockMigration,
    id: "failed-1",
    status: EConfigMigrationStatus.FAILED,
   };

   vi
    .mocked(mockMigrationService.getList)
    .mockResolvedValue(createMockApiListResult([failedMigration]));

   await service.cleanupFailedMigrations("001_test_migration");

   expect(mockMigrationService.getList).toHaveBeenCalledWith({
    where: { name: "001_test_migration", status: EConfigMigrationStatus.FAILED },
   });
   expect(mockMigrationService.delete).toHaveBeenCalledWith({ id: "failed-1" });
  });

  it("should handle when no failed migrations found", async () => {
   vi.mocked(mockMigrationService.getList).mockResolvedValue(createMockApiListResult([]));

   await service.cleanupFailedMigrations();

   expect(mockMigrationService.delete).not.toHaveBeenCalled();
  });
 });

 describe("cleanupStuckMigrations", () => {
  it("should cleanup stuck migrations", async () => {
   const stuckMigration = {
    ...mockMigration,
    id: "stuck-1",
    status: EConfigMigrationStatus.RUNNING,
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
   };

   vi
    .mocked(mockMigrationService.getList)
    .mockResolvedValue(createMockApiListResult([stuckMigration]));

   await service.cleanupStuckMigrations(30);

   expect(mockMigrationService.update).toHaveBeenCalledWith(
    { id: "stuck-1" },
    {
     status: EConfigMigrationStatus.STUCK,
     failedAt: expect.any(Date),
    },
   );
  });

  it("should not cleanup recent running migrations", async () => {
   const recentMigration = {
    ...mockMigration,
    id: "recent-1",
    status: EConfigMigrationStatus.RUNNING,
    startedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
   };

   vi
    .mocked(mockMigrationService.getList)
    .mockResolvedValue(createMockApiListResult([recentMigration]));

   await service.cleanupStuckMigrations(30);

   expect(mockMigrationService.update).not.toHaveBeenCalled();
  });
 });

 describe("getExecutedMigrationList", () => {
  it("should return list of executed migration names", async () => {
   const migrations = [
    { ...mockMigration, name: "001_first" },
    { ...mockMigration, name: "002_second" },
   ];

   vi.mocked(mockMigrationService.getList).mockResolvedValue(createMockApiListResult(migrations));

   const result = await service.getExecutedMigrationList();

   expect(result).toEqual(["001_first", "002_second"]);
  });
 });

 describe("validateMigrations", () => {
  it("should validate migration names are not too long", async () => {
   const longNameMigration = {
    ...mockMigrationDefinition,
    name: "a".repeat(CONFIG_MIGRATION_CONSTANT.MAX_NAME_LENGTH + 1),
   };

   await expect(service.executeMigrations([longNameMigration], true)).rejects.toThrow(
    "Migration names too long",
   );
  });

  it("should validate migration has up method", async () => {
   const migrationWithoutUp = {
    name: "test_migration",
    up: undefined,
   } as any;

   await expect(service.executeMigrations([migrationWithoutUp], true)).rejects.toThrow(
    "Migrations missing required 'up' method",
   );
  });
 });
});
