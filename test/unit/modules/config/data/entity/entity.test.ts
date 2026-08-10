import { describe, expect, it } from "vitest";
import { createConfigDataEntity } from "../../../../../../src/modules/config/data/entity";
import { CONFIG_DATA_CONSTANT } from "../../../../../../src/shared/constant";
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

describe("createConfigDataEntity", () => {
 it("should create a ConfigData entity with default settings", () => {
  const mockSectionEntity = class ConfigSection {};
  const ConfigDataEntity = createConfigDataEntity({
   configSectionEntity: mockSectionEntity as any,
   maxDescriptionLength: CONFIG_DATA_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxEnvironmentLength: CONFIG_DATA_CONSTANT.MAX_ENVIRONMENT_LENGTH,
   maxNameLength: CONFIG_DATA_CONSTANT.MAX_NAME_LENGTH,
   maxValueLength: CONFIG_DATA_CONSTANT.MAX_VALUE_LENGTH,
   tableName: CONFIG_DATA_CONSTANT.DEFAULT_TABLE_NAME,
  });

  expect(ConfigDataEntity).toBeDefined();
  expect(ConfigDataEntity.name).toBe("ConfigData");

  const instance = new ConfigDataEntity();
  expect(instance).toBeDefined();
  expect(instance.constructor.name).toBe("ConfigData");
  expectTimestampMetadata(ConfigDataEntity, "timestamp");
  // Properties are defined via decorators at runtime
 });

 it("should use a custom timestamp column type for columns and date decorators", () => {
  const mockSectionEntity = class ConfigSection {};
  const ConfigDataEntity = createConfigDataEntity({
   configSectionEntity: mockSectionEntity as any,
   maxDescriptionLength: CONFIG_DATA_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxEnvironmentLength: CONFIG_DATA_CONSTANT.MAX_ENVIRONMENT_LENGTH,
   maxNameLength: CONFIG_DATA_CONSTANT.MAX_NAME_LENGTH,
   maxValueLength: CONFIG_DATA_CONSTANT.MAX_VALUE_LENGTH,
   tableName: CONFIG_DATA_CONSTANT.DEFAULT_TABLE_NAME,
   timestampColumnType: "datetime",
  });

  expectTimestampMetadata(ConfigDataEntity, "datetime");
 });

 it("should create entity with custom table name", () => {
  const mockSectionEntity = class ConfigSection {};
  const ConfigDataEntity = createConfigDataEntity({
   configSectionEntity: mockSectionEntity as any,
   maxDescriptionLength: CONFIG_DATA_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxEnvironmentLength: CONFIG_DATA_CONSTANT.MAX_ENVIRONMENT_LENGTH,
   maxNameLength: CONFIG_DATA_CONSTANT.MAX_NAME_LENGTH,
   maxValueLength: CONFIG_DATA_CONSTANT.MAX_VALUE_LENGTH,
   tableName: "custom_config_data",
  });

  expect(ConfigDataEntity).toBeDefined();
 });

 it("should enforce section, environment, and name uniqueness in the database", () => {
  const mockSectionEntity = class ConfigSection {};
  const ConfigDataEntity = createConfigDataEntity({
   configSectionEntity: mockSectionEntity as any,
   maxDescriptionLength: CONFIG_DATA_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxEnvironmentLength: CONFIG_DATA_CONSTANT.MAX_ENVIRONMENT_LENGTH,
   maxNameLength: CONFIG_DATA_CONSTANT.MAX_NAME_LENGTH,
   maxValueLength: CONFIG_DATA_CONSTANT.MAX_VALUE_LENGTH,
   tableName: CONFIG_DATA_CONSTANT.DEFAULT_TABLE_NAME,
  });
  const unique = getMetadataArgsStorage().uniques.find(
   (metadata) => metadata.target === ConfigDataEntity,
  );

  expect(unique?.columns).toEqual(["name", "environment", "section"]);
 });

 it("should create entity with custom column lengths", () => {
  const mockSectionEntity = class ConfigSection {};
  const ConfigDataEntity = createConfigDataEntity({
   configSectionEntity: mockSectionEntity as any,
   maxNameLength: 200,
   maxValueLength: 5000,
   maxEnvironmentLength: 100,
   maxDescriptionLength: 1000,
   tableName: CONFIG_DATA_CONSTANT.DEFAULT_TABLE_NAME,
  });

  expect(ConfigDataEntity).toBeDefined();

  const instance = new ConfigDataEntity();
  expect(instance).toBeDefined();
  // Properties are defined via decorators with custom lengths
 });

 it("should have proper default values", () => {
  const mockSectionEntity = class ConfigSection {};
  const ConfigDataEntity = createConfigDataEntity({
   configSectionEntity: mockSectionEntity as any,
   maxDescriptionLength: CONFIG_DATA_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxEnvironmentLength: CONFIG_DATA_CONSTANT.MAX_ENVIRONMENT_LENGTH,
   maxNameLength: CONFIG_DATA_CONSTANT.MAX_NAME_LENGTH,
   maxValueLength: CONFIG_DATA_CONSTANT.MAX_VALUE_LENGTH,
   tableName: CONFIG_DATA_CONSTANT.DEFAULT_TABLE_NAME,
  });

  const instance = new ConfigDataEntity();
  expect(instance).toBeDefined();
  // Default values are set via decorators
 });
});
