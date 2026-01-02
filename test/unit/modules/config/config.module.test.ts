import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrudConfigModule } from "../../../../src/modules/config/config.module";
import { TOKEN_CONSTANT } from "../../../../src/shared/constant";
import type { IConfigOptions } from "../../../../src/shared/interface/config";

describe("CrudConfigModule", () => {
 beforeEach(() => {
  vi.clearAllMocks();
 });

 describe("register", () => {
  it("should register module with default options", () => {
   const options: IConfigOptions = {};

   const dynamicModule = CrudConfigModule.register(options);

   expect(dynamicModule).toBeDefined();
   expect(dynamicModule.module).toBe(CrudConfigModule);
   expect(dynamicModule.providers).toBeDefined();
   expect(dynamicModule.exports).toBeDefined();
  });

  it("should register module with custom entity options", () => {
   const options: IConfigOptions = {
    entityOptions: {
     tablePrefix: "test_",
     configSection: {
      tableName: "custom_sections",
      maxNameLength: 100,
      maxDescriptionLength: 500,
     },
     configData: {
      tableName: "custom_data",
      maxNameLength: 100,
      maxDescriptionLength: 500,
      maxValueLength: 2000,
      maxEnvironmentLength: 100,
     },
    },
   };

   const dynamicModule = CrudConfigModule.register(options);
   const configOptionsProvider = dynamicModule.providers?.find(
    (p: any) => p.provide === TOKEN_CONSTANT.CONFIG_OPTIONS,
   );

   expect(configOptionsProvider).toBeDefined();
   expect(configOptionsProvider?.useValue).toEqual(options);
  });

  it("should register module with cache enabled", () => {
   const options: IConfigOptions = {
    cacheOptions: {
     isEnabled: true,
     maxCacheItems: 100,
     maxCacheTTL: 3600000,
    },
   };

   const dynamicModule = CrudConfigModule.register(options);
   expect(dynamicModule.imports).toBeDefined();
   expect(dynamicModule.imports?.length).toBeGreaterThan(0);
  });

  it("should register module with controllers disabled", () => {
   const options: IConfigOptions = {
    controllersOptions: {
     section: { isEnabled: false },
     data: { isEnabled: false },
    },
   };

   const dynamicModule = CrudConfigModule.register(options);
   expect(dynamicModule.controllers).toHaveLength(0);
  });

  it("should register module with controllers enabled", () => {
   const options: IConfigOptions = {
    controllersOptions: {
     section: { isEnabled: true },
     data: { isEnabled: true },
    },
   };

   const dynamicModule = CrudConfigModule.register(options);
   expect(dynamicModule.controllers).toBeDefined();
   expect(dynamicModule.controllers?.length).toBe(2);
  });

  it("should register module with encryption enabled", () => {
   const options: IConfigOptions = {
    encryptionOptions: {
     isEnabled: true,
     encryptionKey: "test-encryption-key-32-chars-long",
    },
   };

   const dynamicModule = CrudConfigModule.register(options);
   const configOptionsProvider = dynamicModule.providers?.find(
    (p: any) => p.provide === TOKEN_CONSTANT.CONFIG_OPTIONS,
   );

   expect(configOptionsProvider?.useValue.encryptionOptions?.isEnabled).toBe(true);
  });
 });

 describe("registerAsync", () => {
  it("should register module asynchronously with useFactory", () => {
   const options: IConfigOptions = {
    environment: "test",
   };

   const dynamicModule = CrudConfigModule.registerAsync({
    useFactory: () => options,
   });

   expect(dynamicModule).toBeDefined();
   expect(dynamicModule.module).toBe(CrudConfigModule);

   const configPropertiesProvider = dynamicModule.providers?.find(
    (p: any) => p.provide === TOKEN_CONSTANT.CONFIG_OPTIONS,
   );
   expect(configPropertiesProvider).toBeDefined();
   expect(configPropertiesProvider?.useFactory).toBeDefined();
  });

  it("should register module asynchronously with useClass", () => {
   class ConfigOptionsFactory {
    createOptions(): IConfigOptions {
     return {
      environment: "test",
     };
    }
   }

   const dynamicModule = CrudConfigModule.registerAsync({
    useClass: ConfigOptionsFactory,
   });

   expect(dynamicModule).toBeDefined();
   const providers = dynamicModule.providers || [];
   expect(providers.some((p: any) => p.provide === ConfigOptionsFactory)).toBe(true);
  });

  it("should register module asynchronously with inject dependencies", () => {
   const TEST_TOKEN = "TEST_TOKEN";

   const dynamicModule = CrudConfigModule.registerAsync({
    inject: [TEST_TOKEN],
    useFactory: (testValue: string) => ({
     environment: testValue,
    }),
   });

   const configPropertiesProvider = dynamicModule.providers?.find(
    (p: any) => p.provide === TOKEN_CONSTANT.CONFIG_OPTIONS,
   );

   expect(configPropertiesProvider?.inject).toContain(TEST_TOKEN);
  });

  it("should register module asynchronously with staticOptions for controllers", () => {
   const dynamicModule = CrudConfigModule.registerAsync({
    useFactory: () => ({ environment: "test" }),
    staticOptions: {
     controllersOptions: {
      section: { isEnabled: true },
      data: { isEnabled: true },
     },
    },
   });

   expect(dynamicModule.controllers).toBeDefined();
   expect(dynamicModule.controllers?.length).toBe(2);
  });

  it("should register module asynchronously with controllers disabled via staticOptions", () => {
   const dynamicModule = CrudConfigModule.registerAsync({
    useFactory: () => ({ environment: "test" }),
    staticOptions: {
     controllersOptions: {
      section: { isEnabled: false },
      data: { isEnabled: false },
     },
    },
   });

   expect(dynamicModule.controllers).toHaveLength(0);
  });

  it("should register module asynchronously with custom entity options via staticOptions", () => {
   const dynamicModule = CrudConfigModule.registerAsync({
    useFactory: () => ({ environment: "test" }),
    staticOptions: {
     entityOptions: {
      tablePrefix: "custom_",
      configSection: {
       tableName: "sections",
       maxNameLength: 200,
      },
      configData: {
       tableName: "data",
       maxValueLength: 5000,
      },
     },
    },
   });

   expect(dynamicModule).toBeDefined();
   expect(dynamicModule.module).toBe(CrudConfigModule);

   // Verify entity providers are created with useValue
   const sectionEntityProvider = dynamicModule.providers?.find(
    (p: any) => p.provide === TOKEN_CONSTANT.CONFIG_SECTION_ENTITY,
   ) as any;
   const dataEntityProvider = dynamicModule.providers?.find(
    (p: any) => p.provide === TOKEN_CONSTANT.CONFIG_DATA_ENTITY,
   ) as any;

   expect(sectionEntityProvider).toBeDefined();
   expect(dataEntityProvider).toBeDefined();
   expect(sectionEntityProvider?.useValue).toBeDefined();
   expect(dataEntityProvider?.useValue).toBeDefined();
  });

  it("should register module asynchronously with custom migration entity options via staticOptions", () => {
   const dynamicModule = CrudConfigModule.registerAsync({
    useFactory: () => ({ environment: "test" }),
    staticOptions: {
     migrationEntityOptions: {
      tableName: "my_migrations",
      maxNameLength: 300,
     },
    },
   });

   const migrationEntityProvider = dynamicModule.providers?.find(
    (p: any) => p.provide === TOKEN_CONSTANT.CONFIG_MIGRATION_ENTITY,
   ) as any;

   expect(migrationEntityProvider).toBeDefined();
   expect(migrationEntityProvider?.useValue).toBeDefined();
  });
 });

 describe("entity injection", () => {
  it("should provide entities via tokens after module registration", () => {
   const options: IConfigOptions = {};
   const module = CrudConfigModule.register(options);

   // Check that entity tokens are exported
   expect(module.exports).toContain(TOKEN_CONSTANT.CONFIG_SECTION_ENTITY);
   expect(module.exports).toContain(TOKEN_CONSTANT.CONFIG_DATA_ENTITY);

   // Check that entity providers are available
   const sectionEntityProvider = module.providers?.find(
    (provider: any) =>
     typeof provider === "object" && provider.provide === TOKEN_CONSTANT.CONFIG_SECTION_ENTITY,
   ) as any;
   const dataEntityProvider = module.providers?.find(
    (provider: any) =>
     typeof provider === "object" && provider.provide === TOKEN_CONSTANT.CONFIG_DATA_ENTITY,
   ) as any;

   expect(sectionEntityProvider).toBeDefined();
   expect(dataEntityProvider).toBeDefined();
   expect(sectionEntityProvider?.useValue).toBeDefined();
   expect(dataEntityProvider?.useValue).toBeDefined();
  });

  it("should provide entities via tokens in async registration with useValue", () => {
   const options: IConfigOptions = {};
   const module = CrudConfigModule.registerAsync({
    useFactory: () => options,
   });

   // Check that entity tokens are exported
   expect(module.exports).toContain(TOKEN_CONSTANT.CONFIG_SECTION_ENTITY);
   expect(module.exports).toContain(TOKEN_CONSTANT.CONFIG_DATA_ENTITY);

   // Check that entity providers are available with useValue (not factories)
   const sectionEntityProvider = module.providers?.find(
    (provider: any) =>
     typeof provider === "object" && provider.provide === TOKEN_CONSTANT.CONFIG_SECTION_ENTITY,
   ) as any;
   const dataEntityProvider = module.providers?.find(
    (provider: any) =>
     typeof provider === "object" && provider.provide === TOKEN_CONSTANT.CONFIG_DATA_ENTITY,
   ) as any;

   expect(sectionEntityProvider).toBeDefined();
   expect(dataEntityProvider).toBeDefined();
   // In async registration, entities are now created synchronously via staticOptions
   // and provided as useValue instead of useFactory
   expect(sectionEntityProvider?.useValue).toBeDefined();
   expect(dataEntityProvider?.useValue).toBeDefined();
  });
 });
});
