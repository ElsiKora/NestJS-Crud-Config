import { describe, it, expect } from "vitest";
import { CrudConfigModule } from "../../dist/esm/index";

describe("CrudConfigModule Basic E2E Tests", () => {
 describe("Module Registration", () => {
  it("should create module with default options", () => {
   const module = CrudConfigModule.register({});

   expect(module).toBeDefined();
   expect(module.module).toBe(CrudConfigModule);
   expect(module.providers).toBeDefined();
   expect(module.exports).toBeDefined();
  });

  it("should create module with encryption options", () => {
   const module = CrudConfigModule.register({
    encryptionOptions: {
     isEnabled: true,
     encryptionKey: "test-encryption-key-32-chars-ok!",
    },
   });

   expect(module).toBeDefined();
   expect(module.module).toBe(CrudConfigModule);
  });

  it("should create module with cache options", () => {
   const module = CrudConfigModule.register({
    cacheOptions: {
     isEnabled: true,
     maxCacheTTL: 5000,
     maxCacheItems: 100,
    },
   });

   expect(module).toBeDefined();
   expect(module.module).toBe(CrudConfigModule);
  });

  it("should create module with controllers", () => {
   const module = CrudConfigModule.register({
    controllersOptions: {
     data: {
      isEnabled: true,
     },
     section: {
      isEnabled: true,
     },
    },
   });

   expect(module).toBeDefined();
   expect(module.module).toBe(CrudConfigModule);
   expect(module.controllers).toBeDefined();
   expect(module.controllers?.length).toBe(2);
  });

  it("should create async module", () => {
   const module = CrudConfigModule.registerAsync({
    useFactory: async () => ({
     environment: "production",
     encryptionOptions: {
      isEnabled: false,
     },
    }),
   });

   expect(module).toBeDefined();
   expect(module.module).toBe(CrudConfigModule);
   expect(module.imports).toBeDefined();
  });

  it("should create async module with imports", () => {
   const module = CrudConfigModule.registerAsync({
    imports: [],
    inject: [],
    useFactory: async () => ({
     environment: "staging",
    }),
   });

   expect(module).toBeDefined();
   expect(module.module).toBe(CrudConfigModule);
  });
 });

 describe("Module Structure", () => {
  it("should have correct module structure", () => {
   const module = CrudConfigModule.register({
    environment: "test",
   });

   // Check providers array
   expect(Array.isArray(module.providers)).toBe(true);
   expect(module.providers?.length).toBeGreaterThan(0);

   // Check exports array
   expect(Array.isArray(module.exports)).toBe(true);
   expect(module.exports?.length).toBeGreaterThan(0);
  });

  it("should export CrudConfigService", () => {
   const module = CrudConfigModule.register({});

   // The service should be in exports
   const hasService = module.exports?.some(
    (exp: any) => exp === "CrudConfigService" || exp?.name === "CrudConfigService",
   );

   expect(hasService).toBe(true);
  });

  it("should create module with disabled controllers", () => {
   const module = CrudConfigModule.register({
    controllersOptions: {
     data: {
      isEnabled: false,
     },
     section: {
      isEnabled: false,
     },
    },
   });

   expect(module).toBeDefined();
   expect(module.module).toBe(CrudConfigModule);
   expect(module.controllers).toBeDefined();
   expect(module.controllers?.length).toBe(0);
  });

  it("should create module with entity options", () => {
   const module = CrudConfigModule.register({
    entityOptions: {
     tablePrefix: "test_",
     configSection: {
      tableName: "custom_sections",
      maxNameLength: 256,
      maxDescriptionLength: 1024,
     },
     configData: {
      tableName: "custom_data",
      maxValueLength: 16384,
      maxEnvironmentLength: 128,
      maxNameLength: 256,
      maxDescriptionLength: 1024,
     },
    },
   });

   expect(module).toBeDefined();
   expect(module.module).toBe(CrudConfigModule);
   expect(module.providers).toBeDefined();
   expect(module.exports).toBeDefined();
  });
 });
});
