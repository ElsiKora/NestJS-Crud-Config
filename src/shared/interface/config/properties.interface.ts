/**
 * Interface for ConfigData entity options
 */
export interface IConfigDataEntityOptions {
	/**
	 * Maximum length for description field (default: 512)
	 */
	maxDescriptionLength?: number;

	/**
	 * Maximum length for environment field (default: 64)
	 */
	maxEnvironmentLength?: number;

	/**
	 * Maximum length for name field (default: 128)
	 */
	maxNameLength?: number;

	/**
	 * Maximum length for value field (default: 8192)
	 */
	maxValueLength?: number;

	/**
	 * Table name (default: "config_data")
	 */
	tableName?: string;
}

/**
 * Interface for ConfigSection entity options
 */
export interface IConfigSectionEntityOptions {
	/**
	 * Maximum length for description field (default: 512)
	 */
	maxDescriptionLength?: number;

	/**
	 * Maximum length for name field (default: 128)
	 */
	maxNameLength?: number;

	/**
	 * Table name (default: "config_section")
	 */
	tableName?: string;
}

export interface ICrudConfigCacheProperties {
	/**
	 * Whether to use a cache
	 */
	isEnabled?: boolean;
	/**
	 * Maximum number of cache items
	 */
	maxCacheItems?: number;

	/**
	 * Maximum time to live for cache items
	 */
	maxCacheTTL?: number;
}

/**
 * Interface for configuration properties
 */
export interface ICrudConfigProperties {
	/**
	 * Default application name to use for config paths
	 */
	application?: string;

	/**
	 * Cache options
	 */
	cacheOptions?: ICrudConfigCacheProperties;

	/**
	 * The encryption key to use for encrypting/decrypting config values
	 */
	encryptionKey?: string;

	/**
	 * Entity customization options
	 */
	entityOptions?: IEntityCustomizationOptions;

	/**
	 * Default environment to use for config paths
	 */
	environment?: string;

	/**
	 * Whether to log verbose information
	 */
	isVerbose?: boolean;

	/**
	 * Whether to encrypt sensitive config values
	 */
	shouldEncryptValues?: boolean;
}
/**
 * Interface for entity customization options
 */
export interface IEntityCustomizationOptions {
	/**
	 * ConfigData entity options
	 */
	configData?: IConfigDataEntityOptions;

	/**
	 * ConfigSection entity options
	 */
	configSection?: IConfigSectionEntityOptions;

	/**
	 * Table name prefix for all entities
	 */
	tablePrefix?: string;
}
