import {
 CONTROLLER_API_DECORATOR_CONSTANT,
 EApiRouteType,
 type IApiControllerProperties,
} from "@elsikora/nestjs-crud-automator";
import { describe, expect, it, beforeAll } from "vitest";
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

 it("should merge custom route overrides with default section routes", () => {
  const DynamicController = createDynamicSectionController(mockSectionEntity, {
   properties: {
    routes: {
     [EApiRouteType.DELETE]: { generation: { isEnabled: false } },
    },
   },
  });
  const properties = Reflect.getMetadata(
   CONTROLLER_API_DECORATOR_CONSTANT.PROPERTIES_METADATA_KEY,
   DynamicController,
  ) as IApiControllerProperties<typeof mockSectionEntity>;

  expect(properties.routes?.[EApiRouteType.DELETE]?.generation?.isEnabled).toBe(false);
  expect(properties.routes?.[EApiRouteType.CREATE]?.generation?.isEnabled).toBe(true);
  expect(properties.routes?.[EApiRouteType.UPDATE]?.generation?.isEnabled).toBe(true);
 });

 it("should inject required service", () => {
  const mockService = {} as any;

  const DynamicController = createDynamicSectionController(mockSectionEntity);
  const instance = new DynamicController(mockService);

  expect(instance.service).toBe(mockService);
 });

 it("should have default route configuration", () => {
  const DynamicController = createDynamicSectionController(mockSectionEntity);
  const properties = Reflect.getMetadata(
   CONTROLLER_API_DECORATOR_CONSTANT.PROPERTIES_METADATA_KEY,
   DynamicController,
  ) as IApiControllerProperties<typeof mockSectionEntity>;

  for (const routeType of [
   EApiRouteType.CREATE,
   EApiRouteType.DELETE,
   EApiRouteType.GET,
   EApiRouteType.GET_LIST,
   EApiRouteType.UPDATE,
  ]) {
   expect(properties.routes?.[routeType]?.generation?.isEnabled).toBe(true);
  }
 });
});
