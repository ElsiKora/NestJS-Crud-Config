/**
 * Context options for configuration retrieval
 */
export interface IConfigGetProperties {
	/**
	 * The application name for the configuration
	 */
	application?: string;

	/**
	 * The environment for the configuration
	 */
	environment?: string;

	/**
	 * Path components for hierarchical configuration
	 */
	path?: Array<string>;
}
