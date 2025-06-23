/**
 * CRUD Configuration Module for NestJS.
 * Exports the module, service, and related interfaces.
 */
export { CrudConfigModule } from "./config.module";
export { CrudConfigDynamicModule } from "./config-dynamic.module";
export { CrudConfigSimpleDynamicModule } from "./config-simple-dynamic.module";
export { CrudConfigFullDynamicModule } from "./config-full-dynamic.module";
export { CrudConfigService } from "./config.service";
export * from "./data";
export type * from "./interface";
export * from "./section";
export type * from "./type";
