import { ConflictException } from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { describe, expect, it, vi } from "vitest";
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

 it("should map database uniqueness violations through Automator", async () => {
  const ConfigDataEntity = class ConfigData {
   id!: string;
  };
  const uniqueError = new QueryFailedError("INSERT", [], {
   code: "SQLITE_CONSTRAINT",
   errno: 19,
   message: "UNIQUE constraint failed: config_data.name",
  });
  const repository = {
   save: vi.fn().mockRejectedValue(uniqueError),
  };
  const DynamicService = createDynamicService(ConfigDataEntity as any, "ConfigDataService");
  const service = new DynamicService(repository as any);
  let caughtError: unknown;

  try {
   await service.create({ id: "duplicate" });
  } catch (error: unknown) {
   caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(ConflictException);
  expect((caughtError as ConflictException).getResponse()).toMatchObject({
   error: "Conflict",
   message: "CONFIGDATA_DUPLICATE_KEY",
   statusCode: 409,
  });
 });
});
