import type { EntityManager } from "typeorm/entity-manager/EntityManager";

/**
 * Context options for configuration retrieval
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/crud-config-get-list-options | API Reference - IConfigGetListOptions}
 */
export interface IConfigGetListOptions {
 /**
  * The environment for the configuration, if not specified, the global-configured environment will be used
  */
 environment?: string;

 /**
  * Entity manager for database operations
  */
 eventManager?: EntityManager;

 /**
  * The section for the configuration
  */
 section: string;

 /**
  * Whether or not the configuration should be cached
  */
 useCache?: boolean;
}
