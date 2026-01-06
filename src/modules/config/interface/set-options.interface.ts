import type { EntityManager } from "typeorm/entity-manager/EntityManager";

/**
 * Context options for configuration setting
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/crud-config-set-options | API Reference - IConfigSetOptions}
 */
export interface IConfigSetOptions {
 /**
  * Description for the configuration
  */
 description?: string;

 /**
  * The environment for the configuration
  */
 environment?: string;

 /**
  * Entity manager for database operations
  */
 eventManager?: EntityManager;

 /**
  * The name of the configuration
  */
 name: string;

 /**
  * Path components for hierarchical configuration
  */
 path?: Array<string>;

 /**
  * The section for the configuration
  */
 section: string;

 /**
  * The value for the configuration
  */
 value: string;
}
