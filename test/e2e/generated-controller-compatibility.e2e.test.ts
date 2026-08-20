import type { ApiServiceBase, TApiControllerTargetMethod } from "@elsikora/nestjs-crud-automator";

import { DataSource } from "typeorm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDynamicDataController } from "../../src/modules/config/data/controller";
import { createDynamicSectionController } from "../../src/modules/config/section/controller";
import {
 createConfigDataEntity,
 createConfigSectionEntity,
 createDynamicService,
 type IConfigData,
 type IConfigSection,
} from "../../dist/esm/index";

const HEADERS: Record<string, string> = {};
const IP_ADDRESS = "127.0.0.1";

describe("Automator 4 generated controller compatibility", () => {
 let ConfigDataEntity: ReturnType<typeof createConfigDataEntity>;
 let dataController: InstanceType<TApiControllerTargetMethod<IConfigData>>;
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
  const dataService = new DynamicConfigDataService(
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
});
