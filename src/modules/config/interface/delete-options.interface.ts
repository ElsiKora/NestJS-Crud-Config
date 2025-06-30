import type { EntityManager } from "typeorm/entity-manager/EntityManager";

/**
 * Context options for configuration retrieval
 */
export interface IConfigDeleteOptions {
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
}
