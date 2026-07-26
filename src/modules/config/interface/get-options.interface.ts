import type { EntityManager } from "typeorm";

/**
 * Context options for configuration retrieval
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/crud-config-get-options | API Reference - IConfigGetOptions}
 */
export interface IConfigGetOptions {
 /**
  * The environment for the configuration, if not specified, the global-configured environment will be used
  */
 environment?: string;

 /**
  * When provided, the exact entity manager already bound to an active Automator owner.
  * Omit it for a standalone operation.
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
