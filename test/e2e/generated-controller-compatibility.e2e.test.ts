import type { ApiServiceBase, TApiControllerTargetMethod } from "@elsikora/nestjs-crud-automator";

import { ApiFunctionTransactionScope } from "@elsikora/nestjs-crud-automator";
import { createCache } from "cache-manager";
import { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDynamicDataController } from "../../src/modules/config/data/controller";
import { createDynamicSectionController } from "../../src/modules/config/section/controller";
import {
 createConfigDataEntity,
 createConfigSectionEntity,
 createDynamicService,
 CrudConfigService,
 type IConfigData,
 type IConfigSection,
} from "../../dist/esm/index";

const HEADERS: Record<string, string> = {};
const IP_ADDRESS = "127.0.0.1";

describe("Automator 4 generated controller compatibility", () => {
 let ConfigDataEntity: ReturnType<typeof createConfigDataEntity>;
 let dataController: InstanceType<TApiControllerTargetMethod<IConfigData>>;
 let dataService: ApiServiceBase<IConfigData>;
 let dataSource: DataSource;
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

  dataSource = new DataSource({
   database: new Uint8Array(),
   entities: [ConfigSectionEntity, ConfigDataEntity],
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
  if (dataSource.isInitialized) await dataSource.destroy();
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
});
