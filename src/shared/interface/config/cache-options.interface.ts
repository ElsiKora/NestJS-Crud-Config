/**
 * Interface for cache configuration options
 */
export interface IConfigCacheOptions {
 /**
  * Whether to use a cache
  */
 isEnabled?: boolean;

 /**
  * Maximum number of cache items
  */
 maxCacheItems?: number;

 /**
  * Maximum time to live for cache items in milliseconds
  */
 maxCacheTTL?: number;
}
