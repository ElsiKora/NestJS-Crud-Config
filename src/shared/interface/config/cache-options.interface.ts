/**
 * Interface for cache configuration properties
 */
export interface IConfigCacheProperties {
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
