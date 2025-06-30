import type { IConfigCacheProperties, ICrudConfigEntityOptions } from "@shared/interface";
import type { IConfigEncryptionOptions } from "@shared/interface/config/encryption-options.interface";

/**
 * Interface for configuration options
 */
export interface IConfigOptions {
	/**
	 * Cache options
	 */
	cacheOptions?: IConfigCacheProperties;

	/**
	 * Encryption options
	 */
	encryptionOptions?: IConfigEncryptionOptions;

	/**
	 * Entity customization options
	 */
	entityOptions?: ICrudConfigEntityOptions;

	/**
	 * Default environment to use for config paths
	 */
	environment?: string;

	/**
	 * Whether to log verbose information
	 */
	isVerbose?: boolean;
}
