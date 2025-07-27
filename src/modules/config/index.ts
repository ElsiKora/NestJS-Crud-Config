/**
 * CRUD Configuration Module for NestJS.
 * Exports the module, service, and related interfaces.
 */
export { CrudConfigModule } from "./config.module";
export { CrudConfigService } from "./config.service";
export { type IConfigGetOptions, type IConfigSetOptions } from "./interface";
export type * from "./interface";
export { EConfigMigrationStatus } from "./migration";
export type * from "./migration";
export { ConfigMigrationRunnerService } from "./migration/migration-runner.service";
export { ConfigMigrationService } from "./migration/migration.service";
export type * from "./type";
