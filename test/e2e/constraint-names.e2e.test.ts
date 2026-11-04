import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DataSource } from "typeorm";

import { BUILT_PACKAGE } from "./built-package";

const { createConfigDataEntity, createConfigMigrationEntity, createConfigSectionEntity } =
 BUILT_PACKAGE;

interface IConstraintRow {
 name: string;
 table: string;
 type: string;
}

interface IIndexRow {
 indexname: string;
 tablename: string;
}

describe("dynamic entity constraint and index names", () => {
 let dataSource: DataSource;
 let stopContainer: () => Promise<void> = async () => {};

 beforeAll(async () => {
  let url: string | undefined = process.env.DATABASE_URL;

  if (!url) {
   const { PostgreSqlContainer } = await import("@testcontainers/postgresql");
   const container = await new PostgreSqlContainer("postgres:17-alpine").start();

   url = container.getConnectionUri();
   stopContainer = async () => void (await container.stop());
  }

  const ConfigSectionEntity = createConfigSectionEntity({
   maxDescriptionLength: 512,
   maxNameLength: 128,
   tableName: "config_section",
  });
  const ConfigDataEntity = createConfigDataEntity({
   configSectionEntity: ConfigSectionEntity,
   maxDescriptionLength: 512,
   maxEnvironmentLength: 64,
   maxNameLength: 128,
   maxValueLength: 8192,
   tableName: "config_data",
  });
  const ConfigMigrationEntity = createConfigMigrationEntity({
   maxNameLength: 256,
   tableName: "config_migrations",
  });

  dataSource = new DataSource({
   dropSchema: true,
   entities: [ConfigSectionEntity, ConfigDataEntity, ConfigMigrationEntity],
   logging: false,
   synchronize: true,
   type: "postgres",
   url,
  });
  await dataSource.initialize();
 }, 120_000);

 afterAll(async () => {
  if (dataSource?.isInitialized) await dataSource.destroy();
  await stopContainer();
 });

 it("names every constraint explicitly", async () => {
  const rows = (await dataSource.query(`
   SELECT c.conname AS name, t.relname AS table, c.contype AS type
   FROM pg_catalog.pg_constraint c
   JOIN pg_catalog.pg_class t ON t.oid = c.conrelid
   WHERE t.relname IN ('config_section', 'config_data', 'config_migrations') AND c.contype IN ('p', 'f', 'u')
   ORDER BY t.relname, c.conname
  `)) as Array<IConstraintRow>;

  expect(rows).toEqual([
   { name: "FK_config_data_section", table: "config_data", type: "f" },
   { name: "PK_config_data", table: "config_data", type: "p" },
   { name: "UQ_config_data_name_environment_section", table: "config_data", type: "u" },
   { name: "PK_config_migrations", table: "config_migrations", type: "p" },
   { name: "UQ_config_migrations_name", table: "config_migrations", type: "u" },
   { name: "PK_config_section", table: "config_section", type: "p" },
  ]);
 });

 it("names every index explicitly", async () => {
  const rows = (await dataSource.query(`
   SELECT indexname, tablename
   FROM pg_catalog.pg_indexes
   WHERE tablename IN ('config_section', 'config_data', 'config_migrations')
   ORDER BY tablename, indexname
  `)) as Array<IIndexRow>;

  expect(rows).toEqual([
   { indexname: "PK_config_data", tablename: "config_data" },
   { indexname: "UQ_config_data_name_environment_section", tablename: "config_data" },
   { indexname: "IDX_config_migrations_created_at", tablename: "config_migrations" },
   { indexname: "IDX_config_migrations_started_at", tablename: "config_migrations" },
   { indexname: "IDX_config_migrations_status", tablename: "config_migrations" },
   { indexname: "PK_config_migrations", tablename: "config_migrations" },
   { indexname: "UQ_config_migrations_name", tablename: "config_migrations" },
   { indexname: "PK_config_section", tablename: "config_section" },
  ]);
 });

 it("derives the names from a custom table name", async () => {
  const ConfigSectionEntity = createConfigSectionEntity({
   maxDescriptionLength: 512,
   maxNameLength: 128,
   tableName: "app_section",
  });
  const ConfigDataEntity = createConfigDataEntity({
   configSectionEntity: ConfigSectionEntity,
   maxDescriptionLength: 512,
   maxEnvironmentLength: 64,
   maxNameLength: 128,
   maxValueLength: 8192,
   tableName: "app_data",
  });
  const custom = new DataSource({
   entities: [ConfigSectionEntity, ConfigDataEntity],
   type: "sqljs",
  });
  await custom.initialize();
  const metadata = custom.getMetadata(ConfigDataEntity);
  await custom.destroy();

  expect(metadata.primaryColumns[0]?.primaryKeyConstraintName).toBe("PK_app_data");
  expect(metadata.foreignKeys[0]?.name).toBe("FK_app_data_section");
  expect(metadata.uniques[0]?.name).toBe("UQ_app_data_name_environment_section");
 });
});
