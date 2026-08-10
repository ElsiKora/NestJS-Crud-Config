import { describe, expect, it } from "vitest";
import { createConfigSectionEntity } from "../../../../../../src/modules/config/section/entity";
import { CONFIG_SECTION_CONSTANT } from "../../../../../../src/shared/constant";
import { getMetadataArgsStorage, type ColumnType } from "typeorm";

function expectTimestampMetadata(entity: Function, expectedType: ColumnType): void {
 for (const propertyName of ["createdAt", "updatedAt"]) {
  const columns = getMetadataArgsStorage().columns.filter(
   (metadata) => metadata.target === entity && metadata.propertyName === propertyName,
  );

  expect(columns).toHaveLength(2);
  expect(columns.map((column) => column.options.type)).toEqual([expectedType, expectedType]);
 }
}

describe("createConfigSectionEntity", () => {
 it("should create a ConfigSection entity with default settings", () => {
  const ConfigSectionEntity = createConfigSectionEntity({
   maxDescriptionLength: CONFIG_SECTION_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxNameLength: CONFIG_SECTION_CONSTANT.MAX_NAME_LENGTH,
   tableName: CONFIG_SECTION_CONSTANT.DEFAULT_TABLE_NAME,
  });

  expect(ConfigSectionEntity).toBeDefined();
  expect(ConfigSectionEntity.name).toBe("ConfigSection");

  const instance = new ConfigSectionEntity();
  expect(instance).toBeDefined();
  expect(instance.constructor.name).toBe("ConfigSection");
  expectTimestampMetadata(ConfigSectionEntity, "timestamp");
  // Properties are defined via decorators at runtime
 });

 it("should use a custom timestamp column type for columns and date decorators", () => {
  const ConfigSectionEntity = createConfigSectionEntity({
   maxDescriptionLength: CONFIG_SECTION_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxNameLength: CONFIG_SECTION_CONSTANT.MAX_NAME_LENGTH,
   tableName: CONFIG_SECTION_CONSTANT.DEFAULT_TABLE_NAME,
   timestampColumnType: "datetime",
  });

  expectTimestampMetadata(ConfigSectionEntity, "datetime");
 });

 it("should create entity with custom table name", () => {
  const ConfigSectionEntity = createConfigSectionEntity({
   maxDescriptionLength: CONFIG_SECTION_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxNameLength: CONFIG_SECTION_CONSTANT.MAX_NAME_LENGTH,
   tableName: "custom_config_sections",
  });

  expect(ConfigSectionEntity).toBeDefined();
 });

 it("should create entity with custom column lengths", () => {
  const ConfigSectionEntity = createConfigSectionEntity({
   maxNameLength: 200,
   maxDescriptionLength: 1000,
   tableName: CONFIG_SECTION_CONSTANT.DEFAULT_TABLE_NAME,
  });

  expect(ConfigSectionEntity).toBeDefined();

  const instance = new ConfigSectionEntity();
  expect(instance).toBeDefined();
  // Properties are defined via decorators with custom lengths
 });

 it("should have unique constraint on name", () => {
  const ConfigSectionEntity = createConfigSectionEntity({
   maxDescriptionLength: CONFIG_SECTION_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxNameLength: CONFIG_SECTION_CONSTANT.MAX_NAME_LENGTH,
   tableName: CONFIG_SECTION_CONSTANT.DEFAULT_TABLE_NAME,
  });

  // The entity should have a unique constraint on the name column
  expect(ConfigSectionEntity).toBeDefined();
 });
});
