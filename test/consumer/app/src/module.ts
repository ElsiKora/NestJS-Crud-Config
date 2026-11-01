import type {
 CrudConfigService,
 IConfigMigrationDefinition,
 IConfigOptions,
 TDynamicEntity,
} from "@elsikora/nestjs-crud-config";
import type { DynamicModule } from "@nestjs/common";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import type { EntityManager } from "typeorm";

import { ApiAuthorizationModule } from "@elsikora/nestjs-crud-automator";
import { CrudConfigModule, TOKEN_CONSTANT } from "@elsikora/nestjs-crud-config";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

export const ENCRYPTION_KEY: string = "consumer-smoke-encryption-key-32-chars";
export const ENVIRONMENT: string = "smoke";
export const MIGRATED_NAME: string = "MIGRATED";
export const SECTION: string = "smoke-settings";

const MIGRATION: IConfigMigrationDefinition = {
 description: "Seeds one value inside the crud-config-migrations owner",
 name: "001_consumer_smoke",
 async up(configService: CrudConfigService, entityManager?: EntityManager): Promise<void> {
  await configService.set({
   environment: ENVIRONMENT,
   eventManager: entityManager,
   name: MIGRATED_NAME,
   section: SECTION,
   value: "from-migration",
  });
 },
};

// Automator's generated routes run ApiAuthorizationGuard, whose runtime this global module provides
@Module({ imports: [ApiAuthorizationModule] })
class AppModule {}

/**
 * Returns the table names of a scenario, which exercise the entity and migration table options.
 * @param {string} prefix - Table prefix of the scenario.
 * @returns {{ data: string, migration: string, section: string }} The table names.
 */
export function getTableNames(prefix: string): {
 data: string;
 migration: string;
 section: string;
} {
 return {
  data: `${prefix}config_data`,
  migration: `${prefix}config_migrations`,
  section: `${prefix}config_section`,
 };
}

/**
 * Builds the TypeORM module that registers the CrudConfig entities, as the README shows.
 * @param {string} url - Database URL.
 * @returns {DynamicModule} The TypeORM root module.
 */
function createTypeOrmModule(url: string): DynamicModule {
 return TypeOrmModule.forRootAsync({
  imports: [CrudConfigModule],
  inject: [
   TOKEN_CONSTANT.CONFIG_SECTION_ENTITY,
   TOKEN_CONSTANT.CONFIG_DATA_ENTITY,
   TOKEN_CONSTANT.CONFIG_MIGRATION_ENTITY,
  ],
  useFactory: (
   sectionEntity: TDynamicEntity,
   dataEntity: TDynamicEntity,
   migrationEntity: TDynamicEntity,
  ): TypeOrmModuleOptions => ({
   entities: [sectionEntity, dataEntity, migrationEntity],
   synchronize: true,
   type: "postgres",
   url,
  }),
 });
}

/**
 * Builds the runtime options both registration forms share.
 * @returns {IConfigOptions} Cache, encryption, environment and startup migrations.
 */
function createOptions(): IConfigOptions {
 return {
  cacheOptions: { isEnabled: true, maxCacheItems: 100, maxCacheTTL: 60_000 },
  encryptionOptions: { encryptionKey: ENCRYPTION_KEY, isEnabled: true },
  environment: ENVIRONMENT,
  migrationOptions: {
   isEnabled: true,
   migrations: [MIGRATION],
   shouldRunOnStartup: true,
   useTransaction: true,
  },
  shouldAutoCreateSections: true,
 };
}

/**
 * Builds the application with CrudConfigModule.register.
 * @param {string} prefix - Table prefix.
 * @param {string} url - Database URL.
 * @returns {DynamicModule} The application module.
 */
export function createRegisterModule(prefix: string, url: string): DynamicModule {
 const tables: { data: string; migration: string; section: string } = getTableNames(prefix);

 return {
  imports: [
   CrudConfigModule.register({
    ...createOptions(),
    controllersOptions: {
     data: { isEnabled: true, properties: { path: "smoke/data" } },
     section: { isEnabled: true, properties: { path: "smoke/sections" } },
    },
    entityOptions: {
     configData: { tableName: tables.data },
     configSection: { tableName: tables.section },
    },
    migrationOptions: { ...createOptions().migrationOptions, tableName: tables.migration },
   }),
   createTypeOrmModule(url),
  ],
  module: AppModule,
 };
}

/**
 * Builds the application with CrudConfigModule.registerAsync and staticOptions.
 * @param {string} prefix - Table prefix.
 * @param {string} url - Database URL.
 * @returns {DynamicModule} The application module.
 */
export function createRegisterAsyncModule(prefix: string, url: string): DynamicModule {
 const tables: { data: string; migration: string; section: string } = getTableNames(prefix);

 return {
  imports: [
   CrudConfigModule.registerAsync({
    staticOptions: {
     controllersOptions: {
      data: { isEnabled: true, properties: { path: "smoke/data" } },
      section: { isEnabled: true, properties: { path: "smoke/sections" } },
     },
     entityOptions: {
      configData: { tableName: tables.data },
      configSection: { tableName: tables.section },
     },
     migrationEntityOptions: { tableName: tables.migration },
    },
    useFactory: async (): Promise<IConfigOptions> => createOptions(),
   }),
   createTypeOrmModule(url),
  ],
  module: AppModule,
 };
}
