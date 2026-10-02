import type { ApiServiceBase, TApiControllerTargetMethod } from "@elsikora/nestjs-crud-automator";

import { ApiFunctionTransactionScope } from "@elsikora/nestjs-crud-automator";
import { createCache } from "cache-manager";
import { DataSource, EntitySchema, type EntityManager } from "typeorm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDynamicDataController } from "../../src/modules/config/data/controller";
import { createDynamicSectionController } from "../../src/modules/config/section/controller";
import {
 createConfigDataEntity,
 createConfigSectionEntity,
 createDynamicService,
 ConfigMigrationService,
 CrudConfigService,
 EConfigMigrationStatus,
 type IConfigData,
 type IConfigMigration,
 type IConfigMigrationDefinition,
 type IConfigSection,
} from "../../dist/esm/index";

const HEADERS: Record<string, string> = {};
const IP_ADDRESS = "127.0.0.1";

class ConfigMigrationHistory implements IConfigMigration {
 createdAt!: Date;

 executedAt?: Date;

 failedAt?: Date;

 id!: string;

 name!: string;

 startedAt?: Date;

 status!: EConfigMigrationStatus;

 updatedAt!: Date;
}

describe("Automator 4 generated controller compatibility", () => {
 let ConfigDataEntity: ReturnType<typeof createConfigDataEntity>;
 let dataController: InstanceType<TApiControllerTargetMethod<IConfigData>>;
 let dataService: ApiServiceBase<IConfigData>;
 let dataSource: DataSource;
 let migrationCache: ReturnType<typeof createCache>;
 let migrationConfigService: CrudConfigService;
 let migrationHistoryService: ApiServiceBase<IConfigMigration>;
 let migrationService: ConfigMigrationService;
 let sectionController: InstanceType<TApiControllerTargetMethod<IConfigSection>>;
 let sectionService: ApiServiceBase<IConfigSection>;

 beforeEach(async () => {
  const ConfigSectionEntity = createConfigSectionEntity({
   maxDescriptionLength: 256,
   maxNameLength: 64,
   tableName: "automator_v4_config_sections",
   timestampColumnType: "datetime",
  });

  ConfigDataEntity = createConfigDataEntity({
   configSectionEntity: ConfigSectionEntity,
   maxDescriptionLength: 256,
   maxEnvironmentLength: 64,
   maxNameLength: 64,
   maxValueLength: 1024,
   tableName: "automator_v4_config_data",
   timestampColumnType: "datetime",
  });

  // This SQLjs fixture exercises migration persistence; the public factory uses a native enum.
  const migrationHistorySchema = new EntitySchema<ConfigMigrationHistory>({
   columns: {
    createdAt: { createDate: true, type: "datetime" },
    executedAt: { nullable: true, type: "datetime" },
    failedAt: { nullable: true, type: "datetime" },
    id: { generated: "uuid", primary: true, type: String },
    name: { length: 255, type: String },
    startedAt: { nullable: true, type: "datetime" },
    status: {
     default: EConfigMigrationStatus.PENDING,
     enum: Object.values(EConfigMigrationStatus),
     type: "simple-enum",
    },
    updatedAt: { type: "datetime", updateDate: true },
   },
   name: "ConfigMigrationHistory",
   tableName: "automator_v4_config_migrations",
   target: ConfigMigrationHistory,
   uniques: [{ columns: ["name"] }],
  });

  dataSource = new DataSource({
   database: new Uint8Array(),
   entities: [ConfigSectionEntity, ConfigDataEntity, migrationHistorySchema],
   synchronize: true,
   type: "sqljs",
  });
  await dataSource.initialize();

  const DynamicConfigSectionService = createDynamicService(
   ConfigSectionEntity,
   "ConfigSectionService",
  );
  const DynamicConfigDataService = createDynamicService(ConfigDataEntity, "ConfigDataService");
  dataService = new DynamicConfigDataService(
   dataSource.getRepository(ConfigDataEntity),
  ) as ApiServiceBase<IConfigData>;

  sectionService = new DynamicConfigSectionService(
   dataSource.getRepository(ConfigSectionEntity),
  ) as ApiServiceBase<IConfigSection>;

  const DynamicMigrationHistoryService = createDynamicService(
   ConfigMigrationHistory,
   "ConfigMigrationHistoryService",
  );
  migrationHistoryService = new DynamicMigrationHistoryService(
   dataSource.getRepository(ConfigMigrationHistory),
  ) as ApiServiceBase<IConfigMigration>;
  migrationCache = createCache();
  const migrationOptions = {
   cacheOptions: { isEnabled: false },
   environment: "test",
   migrationOptions: { stuckMigrationTimeoutMinutes: 30 },
  };
  migrationConfigService = new CrudConfigService(
   sectionService,
   dataService,
   migrationCache,
   migrationOptions,
   dataSource,
  );
  migrationService = new ConfigMigrationService(
   dataSource,
   migrationOptions,
   migrationConfigService,
   migrationHistoryService,
  );

  const DynamicConfigSectionController = createDynamicSectionController(
   ConfigSectionEntity,
  ) as TApiControllerTargetMethod<IConfigSection>;
  const DynamicConfigDataController = createDynamicDataController(
   ConfigDataEntity,
  ) as TApiControllerTargetMethod<IConfigData>;

  sectionController = new DynamicConfigSectionController(sectionService);
  dataController = new DynamicConfigDataController(dataService, sectionService);
 });

 afterEach(async () => {
  try {
   await migrationCache?.disconnect();
  } finally {
   if (dataSource.isInitialized) await dataSource.destroy();
  }
 });

 it("executes the generated ConfigSection CRUD routes through decorated built-ins", async () => {
  const created = await sectionController.create(
   { description: "created", name: "application" },
   HEADERS,
   IP_ADDRESS,
  );
  const fetched = await sectionController.get({ id: created.id }, HEADERS, IP_ADDRESS);
  const listed = await sectionController.getList({ limit: 10, page: 1 }, HEADERS, IP_ADDRESS);
  const updated = await sectionController.update(
   { id: created.id },
   { description: "updated", name: "application" },
   HEADERS,
   IP_ADDRESS,
  );

  expect(created.name).toBe("application");
  expect(fetched.name).toBe(created.name);
  expect(listed.count).toBe(1);
  expect(listed.items).toHaveLength(1);
  expect(updated.description).toBe("updated");

  await sectionController.delete({ id: created.id }, HEADERS, IP_ADDRESS);

  await expect(sectionService.get({ where: { id: created.id } })).rejects.toThrow();
 });

 it("hydrates the ConfigData section relation through generated create and update routes", async () => {
  const section = await sectionService.create({ name: "application" });
  const created = await dataController.create(
   {
    environment: "test",
    isEncrypted: false,
    name: "API_KEY",
    section: { id: section.id },
    value: "one",
   },
   HEADERS,
   IP_ADDRESS,
  );
  const updated = await dataController.update(
   { id: created.id },
   {
    environment: "test",
    isEncrypted: false,
    name: "API_KEY",
    section: { id: section.id },
    value: "two",
   },
   HEADERS,
   IP_ADDRESS,
  );
  const fetched = await dataController.get({ id: created.id }, HEADERS, IP_ADDRESS);
  const persisted = await dataSource.getRepository(ConfigDataEntity).findOneOrFail({
   relations: { section: true },
   where: { id: created.id },
  });

  expect(created.value).toBe("one");
  expect(updated.value).toBe("two");
  expect(fetched.value).toBe("two");
  expect(persisted.section.id).toBe(section.id);
 });

 it("keeps configuration reads scoped and fresh through the decorated services", async () => {
  const cache = createCache();
  const configService = new CrudConfigService(
   sectionService,
   dataService,
   cache,
   { cacheOptions: { isEnabled: true }, environment: "test" },
   dataSource,
  );
  const application = await sectionService.create({ name: "application" });
  const integrations = await sectionService.create({ name: "integrations" });
  const target = await dataService.create({
   environment: "test",
   isEncrypted: false,
   name: "API_KEY",
   section: { id: application.id },
   value: "application-test",
  });

  for (const [section, environment, value] of [
   [integrations, "test", "integrations-test"],
   [application, "production", "application-production"],
  ] as const) {
   await dataService.create({
    environment,
    isEncrypted: false,
    name: "API_KEY",
    section: { id: section.id },
    value,
   });
  }

  const lookup = { name: "API_KEY", section: application.name, useCache: false };
  const original = await configService.get(lookup);
  expect(original.id).toBe(target.id);
  expect(original.value).toBe("application-test");
  expect((await configService.get({ ...lookup, section: integrations.name })).value).toBe(
   "integrations-test",
  );
  expect((await configService.get({ ...lookup, environment: "production" })).value).toBe(
   "application-production",
  );
  const hydrated = await configService.get({ ...lookup, shouldLoadSectionInfo: true });
  expect(hydrated.section.id).toBe(application.id);
  expect(hydrated.section.name).toBe(application.name);

  await configService.get({ ...lookup, useCache: true });
  await dataService.update({ id: target.id }, { value: "refreshed" });
  expect((await configService.get(lookup)).value).toBe("refreshed");
  expect((await configService.get({ ...lookup, useCache: true })).value).toBe("application-test");

  const rollback = new Error("Roll back the configuration change");

  try {
   await expect(
    ApiFunctionTransactionScope.runWithDataSource(
     dataSource,
     { name: "configuration-read-visibility" },
     async (eventManager) => {
      await eventManager.update(ConfigDataEntity, { id: target.id }, { value: "uncommitted" });
      expect((await configService.get({ ...lookup, eventManager })).value).toBe("uncommitted");
      throw rollback;
     },
    ),
   ).rejects.toBe(rollback);
  } finally {
   await cache.disconnect();
  }

  expect((await configService.get(lookup)).value).toBe("refreshed");
 });

 it("commits participating migration configuration and history, then skips completed work", async () => {
  await sectionService.create({ name: "application" });
  let ownerManager: EntityManager | undefined;
  let upCalls = 0;
  const migration: IConfigMigrationDefinition = {
   name: "001_participating_commit",
   up: async (configService, eventManager) => {
    upCalls += 1;
    expect(configService).toBe(migrationConfigService);
    expect(eventManager).toBe(ownerManager);
    await configService.set({
     eventManager,
     name: "MIGRATION_KEY",
     section: "application",
     value: "committed",
    });
   },
  };

  await ApiFunctionTransactionScope.runWithDataSource(
   dataSource,
   { name: "migration-participant-commit" },
   async (eventManager) => {
    ownerManager = eventManager;
    await migrationService.executeMigrations([migration], true, eventManager);
    expect(
     (await eventManager.findOneByOrFail(ConfigMigrationHistory, { name: migration.name })).status,
    ).toBe(EConfigMigrationStatus.COMPLETED);
   },
  );

  const history = await dataSource.getRepository(ConfigMigrationHistory).findOneByOrFail({
   name: migration.name,
  });
  expect(history.status).toBe(EConfigMigrationStatus.COMPLETED);
  expect(history.executedAt).toBeInstanceOf(Date);
  expect(
   (await dataSource.getRepository(ConfigDataEntity).findOneByOrFail({ name: "MIGRATION_KEY" }))
    .value,
  ).toBe("committed");

  await ApiFunctionTransactionScope.runWithDataSource(
   dataSource,
   { name: "migration-participant-skip" },
   async (eventManager) => {
    ownerManager = eventManager;
    await migrationService.executeMigrations([migration], true, eventManager);
   },
  );

  expect(upCalls).toBe(1);
  expect(await dataSource.getRepository(ConfigMigrationHistory).count()).toBe(1);
 });

 it("rolls back completed participating work when the outer owner fails later", async () => {
  await sectionService.create({ name: "application" });
  const original = await migrationConfigService.set({
   name: "MIGRATION_KEY",
   section: "application",
   value: "original",
  });
  const lateFailure = new Error("The owner failed after migration execution");
  let ownerManager: EntityManager | undefined;
  const migration: IConfigMigrationDefinition = {
   name: "001_participating_late_failure",
   up: async (configService, eventManager) => {
    expect(eventManager).toBe(ownerManager);
    await configService.set({
     eventManager,
     name: "MIGRATION_KEY",
     section: "application",
     value: "uncommitted",
    });
   },
  };

  await expect(
   ApiFunctionTransactionScope.runWithDataSource(
    dataSource,
    { name: "migration-participant-late-failure" },
    async (eventManager) => {
     ownerManager = eventManager;
     await migrationService.executeMigrations([migration], true, eventManager);
     expect((await eventManager.findOneByOrFail(ConfigDataEntity, { id: original.id })).value).toBe(
      "uncommitted",
     );
     expect(
      (await eventManager.findOneByOrFail(ConfigMigrationHistory, { name: migration.name })).status,
     ).toBe(EConfigMigrationStatus.COMPLETED);
     throw lateFailure;
    },
   ),
  ).rejects.toBe(lateFailure);

  expect(
   (await dataSource.getRepository(ConfigDataEntity).findOneByOrFail({ id: original.id })).value,
  ).toBe("original");
  expect(await dataSource.getRepository(ConfigMigrationHistory).count()).toBe(0);
 });

 it("rolls back configuration and FAILED and STUCK history changes with the outer owner", async () => {
  await sectionService.create({ name: "application" });
  const stale = await migrationHistoryService.create({
   name: "001_stale_history",
   startedAt: new Date(Date.now() - 60 * 60 * 1000),
   status: EConfigMigrationStatus.RUNNING,
  });
  const migrationFailure = new Error("The migration failed after writing configuration");
  let ownerManager: EntityManager | undefined;
  const migration: IConfigMigrationDefinition = {
   name: "002_participating_failure",
   up: async (configService, eventManager) => {
    expect(eventManager).toBe(ownerManager);
    await configService.set({
     eventManager,
     name: "MIGRATION_KEY",
     section: "application",
     value: "uncommitted",
    });
    throw migrationFailure;
   },
  };

  await expect(
   ApiFunctionTransactionScope.runWithDataSource(
    dataSource,
    { name: "migration-participant-status-rollback" },
    async (eventManager) => {
     ownerManager = eventManager;
     await expect(migrationService.executeMigrations([migration], true, eventManager)).rejects.toBe(
      migrationFailure,
     );
     const failed = await eventManager.findOneByOrFail(ConfigMigrationHistory, {
      name: migration.name,
     });
     const stuck = await eventManager.findOneByOrFail(ConfigMigrationHistory, { id: stale.id });
     expect(failed.status).toBe(EConfigMigrationStatus.FAILED);
     expect(failed.failedAt).toBeInstanceOf(Date);
     expect(stuck.status).toBe(EConfigMigrationStatus.STUCK);
     expect(stuck.failedAt).toBeInstanceOf(Date);
     expect(
      (await eventManager.findOneByOrFail(ConfigDataEntity, { name: "MIGRATION_KEY" })).value,
     ).toBe("uncommitted");
     throw migrationFailure;
    },
   ),
  ).rejects.toBe(migrationFailure);

  const history = await dataSource.getRepository(ConfigMigrationHistory).findOneByOrFail({
   id: stale.id,
  });
  expect(history.status).toBe(EConfigMigrationStatus.RUNNING);
  expect(history.failedAt).toBeNull();
  expect(await dataSource.getRepository(ConfigMigrationHistory).count()).toBe(1);
  expect(await dataSource.getRepository(ConfigDataEntity).count()).toBe(0);
 });

 it("restores participating down changes after a late outer failure and commits a later retry", async () => {
  await sectionService.create({ name: "application" });
  const lateFailure = new Error("The owner failed after migration rollback");
  let ownerManager: EntityManager | undefined;
  let downCalls = 0;
  const migration: IConfigMigrationDefinition = {
   name: "001_participating_down",
   down: async (configService, eventManager) => {
    downCalls += 1;
    expect(eventManager).toBe(ownerManager);
    await configService.delete({
     eventManager,
     name: "MIGRATION_KEY",
     section: "application",
    });
   },
   up: async (configService, eventManager) => {
    expect(eventManager).toBeDefined();
    await configService.set({
     eventManager,
     name: "MIGRATION_KEY",
     section: "application",
     value: "original",
    });
   },
  };
  await migrationService.executeMigrations([migration]);
  const originalHistory = await dataSource.getRepository(ConfigMigrationHistory).findOneByOrFail({
   name: migration.name,
  });
  const originalConfig = await dataSource.getRepository(ConfigDataEntity).findOneByOrFail({
   name: "MIGRATION_KEY",
  });

  await expect(
   ApiFunctionTransactionScope.runWithDataSource(
    dataSource,
    { name: "migration-participant-down-late-failure" },
    async (eventManager) => {
     ownerManager = eventManager;
     await migrationService.rollbackMigration(migration.name, [migration], eventManager);
     expect(await eventManager.count(ConfigMigrationHistory)).toBe(0);
     expect(await eventManager.count(ConfigDataEntity)).toBe(0);
     throw lateFailure;
    },
   ),
  ).rejects.toBe(lateFailure);

  const restoredHistory = await dataSource
   .getRepository(ConfigMigrationHistory)
   .findOneByOrFail({ id: originalHistory.id });
  expect(restoredHistory.status).toBe(EConfigMigrationStatus.COMPLETED);
  expect(restoredHistory.failedAt).toBeNull();
  expect(restoredHistory.executedAt).toEqual(originalHistory.executedAt);
  expect(
   (await dataSource.getRepository(ConfigDataEntity).findOneByOrFail({ id: originalConfig.id }))
    .value,
  ).toBe("original");

  await ApiFunctionTransactionScope.runWithDataSource(
   dataSource,
   { name: "migration-participant-down-commit" },
   async (eventManager) => {
    ownerManager = eventManager;
    await migrationService.rollbackMigration(migration.name, [migration], eventManager);
   },
  );

  expect(downCalls).toBe(2);
  expect(await dataSource.getRepository(ConfigMigrationHistory).count()).toBe(0);
  expect(await dataSource.getRepository(ConfigDataEntity).count()).toBe(0);
 });
});
