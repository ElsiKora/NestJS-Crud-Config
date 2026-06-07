import {
 CONTROLLER_API_DECORATOR_CONSTANT,
 EApiControllerRelationReferenceShape,
 EApiRouteType,
 type IApiControllerProperties,
} from "@elsikora/nestjs-crud-automator";
import { describe, expect, it, beforeAll } from "vitest";
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

 it("should merge custom route overrides with default data routes", () => {
  const DynamicController = createDynamicDataController(mockDataEntity, {
   properties: {
    routes: {
     [EApiRouteType.DELETE]: { generation: { isEnabled: false } },
    },
   },
  });
  const properties = Reflect.getMetadata(
   CONTROLLER_API_DECORATOR_CONSTANT.PROPERTIES_METADATA_KEY,
   DynamicController,
  ) as IApiControllerProperties<typeof mockDataEntity>;

  expect(properties.routes?.[EApiRouteType.DELETE]?.generation?.isEnabled).toBe(false);
  expect(properties.routes?.[EApiRouteType.CREATE]?.generation?.isEnabled).toBe(true);
  expect(properties.routes?.[EApiRouteType.UPDATE]?.relations?.request).toEqual({
   load: {
    include: {
     section: true,
    },
    relationLoadStrategy: "query",
   },
   reference: {
    key: "id",
    shape: EApiControllerRelationReferenceShape.OBJECT,
   },
  });
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
  const properties = Reflect.getMetadata(
   CONTROLLER_API_DECORATOR_CONSTANT.PROPERTIES_METADATA_KEY,
   DynamicController,
  ) as IApiControllerProperties<typeof mockDataEntity>;

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

 it("should configure section relation loading for create and update routes", () => {
  const DynamicController = createDynamicDataController(mockDataEntity);
  const properties = Reflect.getMetadata(
   CONTROLLER_API_DECORATOR_CONSTANT.PROPERTIES_METADATA_KEY,
   DynamicController,
  ) as IApiControllerProperties<typeof mockDataEntity>;

  for (const routeType of [EApiRouteType.CREATE, EApiRouteType.UPDATE]) {
   expect(properties.routes?.[routeType]?.relations?.request).toEqual({
    load: {
     include: {
      section: true,
     },
     relationLoadStrategy: "query",
    },
    reference: {
     key: "id",
     shape: EApiControllerRelationReferenceShape.OBJECT,
    },
   });
  }
 });
});
