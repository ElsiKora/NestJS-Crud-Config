import type { CrudConfigService } from "@modules/config/config.service";
import type { EntityManager } from "typeorm";

/**
 * Interface for defining a migration
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/migration-system/definitions | Migration System - Definitions}
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/config-migration-definition | API Reference - IConfigMigrationDefinition}
 */
export interface IConfigMigrationDefinition {
 /**
  * Description of what this migration does
  */
 description?: string;

 /**
  * Optional rollback function (for future use)
  * @param {CrudConfigService} configService - The config service for managing configurations
  * @param {EntityManager} [entityManager] - Optional entity manager for transactions
  * @returns {Promise<void>} Promise that resolves when rollback is complete
  */
 down?: (configService: CrudConfigService, entityManager?: EntityManager) => Promise<void>;

 /**
  * Unique name of the migration (should be sortable, e.g., "001_initial_config")
  */
 name: string;

 /**
  * The migration function that will be executed
  * @param {CrudConfigService} configService - The config service for managing configurations
  * @param {EntityManager} [entityManager] - Optional entity manager for transactions
  * @returns {Promise<void>} Promise that resolves when migration is complete
  */
 up: (configService: CrudConfigService, entityManager?: EntityManager) => Promise<void>;
}
