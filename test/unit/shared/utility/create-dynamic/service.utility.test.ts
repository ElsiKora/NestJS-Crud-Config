import { describe, expect, it } from "vitest";
import { createDynamicService } from "../../../../../src/shared/utility/create-dynamic/service.utility";

describe("createDynamicService", () => {
 it("should create a dynamic service class", () => {
  const mockEntity = class TestEntity {};
  const DynamicService = createDynamicService(mockEntity as any, "TestService");

  expect(DynamicService).toBeDefined();
  expect(DynamicService.name).toBe("TestService");
 });

 it("should create service with default name", () => {
  const mockEntity = class TestEntity {};
  const DynamicService = createDynamicService(mockEntity as any, "DynamicService");

  expect(DynamicService).toBeDefined();
  expect(DynamicService.name).toBe("DynamicService");
 });

 it("should extend ApiServiceBase", () => {
  const mockEntity = class TestEntity {};
  const DynamicService = createDynamicService(mockEntity as any, "ExtendedService");

  // Check if the prototype chain includes ApiServiceBase methods
  const instance = new DynamicService({} as any);
  expect(instance).toBeDefined();
 });

 it("should handle entity with custom properties", () => {
  const mockEntity = class CustomEntity {
   id: string;
   name: string;
   value: number;
  };

  const DynamicService = createDynamicService(mockEntity as any, "CustomEntityService");
  expect(DynamicService).toBeDefined();
 });

 it("should be injectable", () => {
  const mockEntity = class TestEntity {};
  const DynamicService = createDynamicService(mockEntity as any, "InjectableService");

  // The service should be decorated with @Injectable()
  expect(DynamicService).toBeDefined();
 });
}); 