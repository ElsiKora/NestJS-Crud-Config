/**
 * Context options for configuration setting
 */
export interface IConfigSetOptions {
	/**
	 * The environment for the configuration
	 */
	environment?: string;

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
	 * Whether the value should be encrypted before saving
	 */
	shouldEncrypt?: boolean;

	/**
	 * Description for the configuration
	 */
	description?: string;
} 