import type { IConfigControllersOptions } from "./controller-options.interface";
import type { ICrudConfigEntityOptions } from "./entity";

/**
 * Interface for migration entity options in static configuration.
 * Contains only the entity-related settings that must be known at module registration time.
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/config-static-options | API Reference - IConfigStaticOptions}
 */
export interface IConfigStaticMigrationEntityOptions {
 /**
  * Maximum length for migration name field
  */
 maxNameLength?: number;

 /**
  * Table name for storing migration history
  */
 tableName?: string;
}

/**
 * Interface for static configuration options that must be known at module registration time.
 * These options cannot be resolved asynchronously due to NestJS module system limitations.
 *
 * NestJS does not support async controller registration, so controllers and their
 * dependent entities must be configured statically. Use this interface when registering
 * the module with `registerAsync()` to provide these static options.
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/core-concepts/module-registration | Core Concepts - Module Registration}
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/config-static-options | API Reference - IConfigStaticOptions}
 */
export interface IConfigStaticOptions {
 /**
  * Controllers configuration options.
  * Controls whether REST API endpoints are enabled and their paths.
  */
 controllersOptions?: IConfigControllersOptions;

 /**
  * Entity customization options.
  * Controls table names, field lengths, and other entity-level settings
  * for ConfigSection and ConfigData entities.
  */
 entityOptions?: ICrudConfigEntityOptions;

 /**
  * Migration entity options.
  * Controls table name and field lengths for the migration tracking entity.
  */
 migrationEntityOptions?: IConfigStaticMigrationEntityOptions;
}
