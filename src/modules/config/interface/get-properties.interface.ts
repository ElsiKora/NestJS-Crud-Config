/**
 * Context options for configuration retrieval
 */
export interface IConfigGetOptions {
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
	 * Whether or not the configuration should be decrypted if encrypted before returning
	 */
	shouldDecrypt?: boolean;

	/**
	 * Whether or not the section info should be loaded
	 */
	shouldLoadSectionInfo?: boolean;

	/**
	 * Whether or not the configuration should be cached
	 */
	useCache?: boolean;
}
