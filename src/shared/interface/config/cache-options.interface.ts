/**
 * Interface for cache configuration options
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/config-cache-options | API Reference - IConfigCacheOptions}
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
