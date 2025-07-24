import { describe, expect, it, vi, beforeAll } from "vitest";
import { createDynamicDataController } from "../../../../../src/modules/config/data/controller";
import { createConfigDataEntity } from "../../../../../src/modules/config/data/entity";
import { createConfigSectionEntity } from "../../../../../src/modules/config/section/entity";
import { CONFIG_DATA_CONSTANT, CONFIG_SECTION_CONSTANT } from "../../../../../src/shared/constant";

describe("createDynamicDataController", () => {
 let mockDataEntity: any;
 let mockSectionEntity: any;

 beforeAll(() => {
  // Create proper entities with all metadata for testing
  mockSectionEntity = createConfigSectionEntity({
   maxDescriptionLength: CONFIG_SECTION_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxNameLength: CONFIG_SECTION_CONSTANT.MAX_NAME_LENGTH,
   tableName: "test_config_sections",
  });

  mockDataEntity = createConfigDataEntity({
   configSectionEntity: mockSectionEntity,
   maxDescriptionLength: CONFIG_DATA_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxEnvironmentLength: CONFIG_DATA_CONSTANT.MAX_ENVIRONMENT_LENGTH,
   maxNameLength: CONFIG_DATA_CONSTANT.MAX_NAME_LENGTH,
   maxValueLength: CONFIG_DATA_CONSTANT.MAX_VALUE_LENGTH,
   tableName: "test_config_data",
  });
 });

 it("should create a dynamic data controller", () => {
  const DynamicController = createDynamicDataController(mockDataEntity);

  expect(DynamicController).toBeDefined();
  expect(DynamicController.name).toBe("DynamicConfigDataController");
 });

 it("should create controller with custom options", () => {
  const customOptions = {
   properties: {
    name: "CustomConfigData",
    path: "custom/config/data",
   },
  };

  const DynamicController = createDynamicDataController(mockDataEntity, customOptions);
  expect(DynamicController).toBeDefined();
 });

 it("should inject required services", () => {
  const mockDataService = {} as any;
  const mockSectionService = {} as any;

  const DynamicController = createDynamicDataController(mockDataEntity);
  const instance = new DynamicController(mockDataService, mockSectionService);

  expect(instance.service).toBe(mockDataService);
  expect(instance.sectionService).toBe(mockSectionService);
 });

 it("should have default route configuration", () => {
  const DynamicController = createDynamicDataController(mockDataEntity);

  // The controller should be decorated with ApiController
  expect(DynamicController).toBeDefined();
 });
});
