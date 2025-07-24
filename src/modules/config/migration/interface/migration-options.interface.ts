import type { IConfigMigrationDefinition } from "./migration-definition.interface";

/**
 * Interface for migration configuration options
 */
export interface IConfigMigrationOptions {
 /**
  * Whether migrations are enabled
  */
 isEnabled?: boolean;

 /**
  * Maximum length for migration name field
  */
 maxNameLength?: number;

 /**
  * Array of migration definitions to execute
  */
 migrations?: Array<IConfigMigrationDefinition>;

 /**
  * Whether to run migrations automatically on application startup
  */
 shouldRunOnStartup?: boolean;

 /**
  * Timeout in minutes for stuck migration cleanup (default: 30)
  */
 stuckMigrationTimeoutMinutes?: number;

 /**
  * Table name for storing migration history
  */
 tableName?: string;

 /**
  * Whether to run migrations in transaction
  */
 useTransaction?: boolean;
}
