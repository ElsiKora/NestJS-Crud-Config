import type { EntityManager } from "typeorm";

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
  * Exact entity manager already bound to an active Automator owner.
  * Omit it for a standalone set, which owns the named crud-config-set transaction.
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
