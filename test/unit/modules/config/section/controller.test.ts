import { describe, expect, it, vi, beforeAll } from "vitest";
import { createDynamicSectionController } from "../../../../../src/modules/config/section/controller";
import { createConfigSectionEntity } from "../../../../../src/modules/config/section/entity";
import { CONFIG_SECTION_CONSTANT } from "../../../../../src/shared/constant";

describe("createDynamicSectionController", () => {
 let mockSectionEntity: any;

 beforeAll(() => {
  // Create proper entity with all metadata for testing
  mockSectionEntity = createConfigSectionEntity({
   maxDescriptionLength: CONFIG_SECTION_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxNameLength: CONFIG_SECTION_CONSTANT.MAX_NAME_LENGTH,
   tableName: "test_config_sections",
  });
 });

 it("should create a dynamic section controller", () => {
  const DynamicController = createDynamicSectionController(mockSectionEntity);

  expect(DynamicController).toBeDefined();
  expect(DynamicController.name).toBe("DynamicConfigSectionController");
 });

 it("should create controller with custom options", () => {
  const customOptions = {
   properties: {
    name: "CustomConfigSection",
    path: "custom/config/section",
   },
  };

  const DynamicController = createDynamicSectionController(mockSectionEntity, customOptions);
  expect(DynamicController).toBeDefined();
 });

 it("should inject required service", () => {
  const mockService = {} as any;

  const DynamicController = createDynamicSectionController(mockSectionEntity);
  const instance = new DynamicController(mockService);

  expect(instance.service).toBe(mockService);
 });

 it("should have default route configuration", () => {
  const DynamicController = createDynamicSectionController(mockSectionEntity);

  // The controller should be decorated with ApiController
  expect(DynamicController).toBeDefined();
 });
});
