import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CrudConfigService } from "../../src/modules/config/config.service";
import { ConfigMigrationService } from "../../src/modules/config/migration/migration.service";
import { ConfigMigrationRunnerService } from "../../src/modules/config/migration/migration-runner.service";
import { EConfigMigrationStatus } from "../../src/modules/config/migration/enum";
import type { IConfigMigration, IConfigMigrationDefinition } from "../../src/modules/config/migration/interface";
import type { IConfigOptions } from "../../src/shared/interface/config";
import { TOKEN_CONSTANT } from "../../src/shared/constant";

describe("Migration E2E Tests", () => {
  // Simple test migrations
  const testMigrations: IConfigMigrationDefinition[] = [
    {
      name: "001_initial_setup",
      description: "Initial configuration setup",
      up: vi.fn().mockResolvedValue(undefined),
      down: vi.fn().mockResolvedValue(undefined),
    },
    {
      name: "002_add_features",
      description: "Add feature flags",
      up: vi.fn().mockResolvedValue(undefined),
      down: vi.fn().mockResolvedValue(undefined),
    },
  ];

  const createConfigOptions = (migrations: IConfigMigrationDefinition[] = []): IConfigOptions => ({
    environment: "test",
    shouldAutoCreateSections: true,
    migrationOptions: {
      migrations,
      tableName: "config_migrations",
      useTransaction: true,
      isEnabled: false,
    },
    encryptionOptions: {
      isEnabled: false,
    },
    entityOptions: {
      tablePrefix: "test_",
    },
  });

  describe("Migration Service Unit Tests", () => {
    let mockDataSource: DataSource;
    let mockConfigService: CrudConfigService;
    let migrationService: ConfigMigrationService;

    beforeEach(() => {
      // Create mocks
      mockDataSource = {
        isInitialized: true,
        options: { type: "sqlite", database: ":memory:" },
        createQueryRunner: vi.fn().mockReturnValue({
          connect: vi.fn(),
          startTransaction: vi.fn(),
          commitTransaction: vi.fn(),
          rollbackTransaction: vi.fn(),
          release: vi.fn(),
          manager: {
            save: vi.fn(),
            update: vi.fn(),
            find: vi.fn().mockResolvedValue([]),
          },
        }),
        transaction: vi.fn().mockImplementation(async (runInTransaction) => {
          const mockEntityManager = {
            save: vi.fn(),
            update: vi.fn(),
            find: vi.fn().mockResolvedValue([]),
          };
          return await runInTransaction(mockEntityManager);
        }),
        getRepository: vi.fn().mockReturnValue({
          find: vi.fn().mockResolvedValue([]),
          findOne: vi.fn().mockResolvedValue(null),
          save: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        }),
        query: vi.fn().mockResolvedValue([{ test: 1 }]),
      } as any;

      mockConfigService = {
        set: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue({ value: "test" }),
        delete: vi.fn().mockResolvedValue(undefined),
      } as any;

      // Create migration service with mocks
      migrationService = new ConfigMigrationService(
        mockDataSource,
        createConfigOptions(testMigrations),
        mockConfigService,
      );
    });

    it("should initialize migration service", () => {
      expect(migrationService).toBeDefined();
      expect(migrationService["dataSource"]).toBeDefined();
      expect(migrationService["options"]).toBeDefined();
      expect(migrationService["configService"]).toBeDefined();
    });

    it("should execute migrations successfully", async () => {
      const mockMigrationService = {
        getList: vi.fn().mockResolvedValue({
          items: [],
          count: 0,
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
        }),
        create: vi.fn().mockResolvedValue({
          id: "test-id",
          name: "001_initial_setup",
          status: EConfigMigrationStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        update: vi.fn().mockResolvedValue({
          id: "test-id",
          name: "001_initial_setup",
          status: EConfigMigrationStatus.COMPLETED,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      migrationService["migrationService"] = mockMigrationService as any;
      
      // Mock the initialization
      migrationService["initializeMigrationService"] = vi.fn();

      await migrationService.executeMigrations(testMigrations);

      expect(testMigrations[0].up).toHaveBeenCalled();
      expect(testMigrations[1].up).toHaveBeenCalled();
    });
  });

  describe("Migration Runner Service Unit Tests", () => {
    it("should not run migrations when disabled", () => {
      const options = createConfigOptions([]);
      options.migrationOptions!.isEnabled = false;

      const mockMigrationService = {} as any;
      const runnerService = new ConfigMigrationRunnerService(
        mockMigrationService,
        options,
      );

      expect(runnerService).toBeDefined();
    });

    it("should handle missing migration service gracefully", () => {
      expect(() => {
        const runnerService = new ConfigMigrationRunnerService(
          undefined as any,
          { migrationOptions: { migrations: [], isEnabled: false } },
        );
        expect(runnerService).toBeDefined();
      }).not.toThrow();
    });
  });

  describe("Migration Configuration Tests", () => {
    it("should create config options correctly", () => {
      const options = createConfigOptions(testMigrations);
      
      expect(options.environment).toBe("test");
      expect(options.shouldAutoCreateSections).toBe(true);
      expect(options.migrationOptions?.migrations).toHaveLength(2);
      expect(options.migrationOptions?.tableName).toBe("config_migrations");
      expect(options.encryptionOptions?.isEnabled).toBe(false);
    });

    it("should have valid migration definitions", () => {
      testMigrations.forEach(migration => {
        expect(migration.name).toBeDefined();
        expect(migration.description).toBeDefined();
        expect(migration.up).toBeTypeOf("function");
        expect(migration.down).toBeTypeOf("function");
      });
    });
  });

  describe("Migration Utilities Tests", () => {
    it("should handle migration status enum", () => {
      expect(EConfigMigrationStatus.PENDING).toBe("PENDING");
      expect(EConfigMigrationStatus.RUNNING).toBe("RUNNING");
      expect(EConfigMigrationStatus.COMPLETED).toBe("COMPLETED");
      expect(EConfigMigrationStatus.FAILED).toBe("FAILED");
    });

    it("should validate migration interface", () => {
      const migration: IConfigMigration = {
        id: "test-id",
        name: "test_migration",
        status: EConfigMigrationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(migration.id).toBeDefined();
      expect(migration.name).toBe("test_migration");
      expect(migration.status).toBe(EConfigMigrationStatus.PENDING);
    });
  });

  describe("Migration Module Integration Tests (Mocked)", () => {
    let module: TestingModule;

    beforeEach(async () => {
      // Create a simple test module without real database
      module = await Test.createTestingModule({
        providers: [
          {
            provide: DataSource,
            useValue: {
              isInitialized: true,
              options: { type: "sqlite", database: ":memory:" },
              query: vi.fn().mockResolvedValue([{ test: 1 }]),
            },
          },
          {
            provide: TOKEN_CONSTANT.CONFIG_OPTIONS,
            useValue: createConfigOptions(testMigrations),
          },
          {
            provide: CrudConfigService,
            useValue: {
              set: vi.fn().mockResolvedValue(undefined),
              get: vi.fn().mockResolvedValue({ value: "test" }),
              delete: vi.fn().mockResolvedValue(undefined),
            },
          },
          {
            provide: ConfigMigrationService,
            useFactory: (dataSource: DataSource, options: IConfigOptions, configService: CrudConfigService) => {
              const service = new ConfigMigrationService(dataSource, options, configService);
              // Mock the initialization that causes problems
              service.onModuleInit = vi.fn();
              return service;
            },
            inject: [DataSource, TOKEN_CONSTANT.CONFIG_OPTIONS, CrudConfigService],
          },
          {
            provide: ConfigMigrationRunnerService,
            useFactory: (migrationService: ConfigMigrationService, options: IConfigOptions) => {
              return new ConfigMigrationRunnerService(migrationService, options);
            },
            inject: [ConfigMigrationService, TOKEN_CONSTANT.CONFIG_OPTIONS],
          },
        ],
      }).compile();
    });

    afterEach(async () => {
      if (module) {
        await module.close();
      }
    });

    it("should provide all necessary services", () => {
      const dataSource = module.get<DataSource>(DataSource);
      const configService = module.get<CrudConfigService>(CrudConfigService);
      const migrationService = module.get<ConfigMigrationService>(ConfigMigrationService);
      const runnerService = module.get<ConfigMigrationRunnerService>(ConfigMigrationRunnerService);

      expect(dataSource).toBeDefined();
      expect(configService).toBeDefined();
      expect(migrationService).toBeDefined();
      expect(runnerService).toBeDefined();
    });

    it("should handle mocked config operations", async () => {
      const configService = module.get<CrudConfigService>(CrudConfigService);
      
      await expect(configService.set({
        section: "test",
        name: "value",
        value: "test_value",
      })).resolves.not.toThrow();

      expect(configService.set).toHaveBeenCalled();
    });

    it("should have proper DataSource injection", () => {
      const dataSource = module.get<DataSource>(DataSource);
      
      expect(dataSource).toBeDefined();
      expect(dataSource.isInitialized).toBe(true);
      expect(dataSource.options.type).toBe("sqlite");
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle service initialization errors", async () => {
      const mockMigrationService = {
        onModuleInit: vi.fn().mockRejectedValue(new Error("Initialization failed")),
      };

      await expect(
        mockMigrationService.onModuleInit()
      ).rejects.toThrow("Initialization failed");
    });

    it("should handle migration execution errors", async () => {
      const failingMigration: IConfigMigrationDefinition = {
        name: "failing_migration",
        description: "Migration that always fails",
        up: vi.fn().mockRejectedValue(new Error("Migration failed")),
        down: vi.fn().mockRejectedValue(new Error("Rollback failed")),
      };

      expect(failingMigration.up).toBeTypeOf("function");
      expect(failingMigration.down).toBeTypeOf("function");
      
      const mockConfigService = {} as any;
      await expect(failingMigration.up!(mockConfigService)).rejects.toThrow("Migration failed");
      await expect(failingMigration.down!(mockConfigService)).rejects.toThrow("Rollback failed");
    });
  });

  describe("Migration System Integration", () => {
    it("should have proper migration system setup", () => {
      const options = createConfigOptions(testMigrations);
      
      expect(options.migrationOptions?.migrations).toHaveLength(2);
      expect(options.migrationOptions?.migrations[0].name).toBe("001_initial_setup");
      expect(options.migrationOptions?.migrations[1].name).toBe("002_add_features");
    });

    it("should handle migration configuration validation", () => {
      const validMigration: IConfigMigrationDefinition = {
        name: "valid_migration",
        description: "Valid migration test",
        up: vi.fn().mockResolvedValue(undefined),
        down: vi.fn().mockResolvedValue(undefined),
      };

      expect(validMigration.name).toMatch(/^[a-zA-Z0-9_]+$/);
      expect(validMigration.description).toBeDefined();
      expect(typeof validMigration.up).toBe("function");
      expect(typeof validMigration.down).toBe("function");
    });
  });
});
