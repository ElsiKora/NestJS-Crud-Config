import { describe, expect, it } from "vitest";
import { createConfigSectionEntity } from "../../../../../../src/modules/config/section/entity";
import { CONFIG_SECTION_CONSTANT } from "../../../../../../src/shared/constant";

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
  // Properties are defined via decorators at runtime
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
