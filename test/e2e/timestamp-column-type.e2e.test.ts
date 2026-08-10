import { afterEach, describe, expect, it } from "vitest";
import { DataSource } from "typeorm";

import { createConfigDataEntity, createConfigSectionEntity } from "../../dist/esm/index";

describe("dynamic entity timestamp column type", () => {
 let dataSource: DataSource | undefined;

 afterEach(async () => {
  if (dataSource?.isInitialized) await dataSource.destroy();
 });

 it("creates and persists SQL.js entities with datetime timestamp columns", async () => {
  const ConfigSectionEntity = createConfigSectionEntity({
   maxDescriptionLength: 512,
   maxNameLength: 128,
   tableName: "datetime_config_section",
   timestampColumnType: "datetime",
  });
  const ConfigDataEntity = createConfigDataEntity({
   configSectionEntity: ConfigSectionEntity,
   maxDescriptionLength: 512,
   maxEnvironmentLength: 64,
   maxNameLength: 128,
   maxValueLength: 8192,
   tableName: "datetime_config_data",
   timestampColumnType: "datetime",
  });

  dataSource = new DataSource({
   entities: [ConfigSectionEntity, ConfigDataEntity],
   logging: false,
   synchronize: true,
   type: "sqljs",
  });
  await dataSource.initialize();

  const sectionColumns = (await dataSource.query(
   'PRAGMA table_info("datetime_config_section")',
  )) as Array<{ name: string; type: string }>;
  const dataColumns = (await dataSource.query(
   'PRAGMA table_info("datetime_config_data")',
  )) as Array<{ name: string; type: string }>;

  for (const columns of [sectionColumns, dataColumns]) {
   expect(
    columns
     .filter((column) => ["createdAt", "updatedAt"].includes(column.name))
     .map((column) => column.type.toLowerCase()),
   ).toEqual(["datetime", "datetime"]);
  }

  const section = await dataSource.getRepository(ConfigSectionEntity).save({ name: "runtime" });
  const data = await dataSource.getRepository(ConfigDataEntity).save({
   environment: "test",
   isEncrypted: false,
   name: "DATABASE_URL",
   section,
   value: "sqljs://memory",
  });

  expect(section.createdAt).toBeInstanceOf(Date);
  expect(section.updatedAt).toBeInstanceOf(Date);
  expect(data.createdAt).toBeInstanceOf(Date);
  expect(data.updatedAt).toBeInstanceOf(Date);
 });
});
