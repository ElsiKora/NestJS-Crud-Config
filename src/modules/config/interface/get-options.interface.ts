import type { EntityManager } from "typeorm/entity-manager/EntityManager";

/**
 * Context options for configuration retrieval
 */
export interface IConfigGetOptions {
 /**
  * The environment for the configuration, if not specified, the global-configured environment will be used
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
  * The section for the configuration
  */
 section: string;

 /**
  * Whether or not the section info should be loaded
  */
 shouldLoadSectionInfo?: boolean;

 /**
  * Whether or not the configuration should be cached
  */
 useCache?: boolean;
}
