import type { IConfigCacheOptions } from "./cache-options.interface";
import type { IConfigControllersOptions } from "./controller-options.interface";
import type { IConfigEncryptionOptions } from "./encryption-options.interface";
import type { ICrudConfigEntityOptions } from "./entity";

/**
 * Interface for configuration options
 */
export interface IConfigOptions {
 /**
  * Cache configuration options
  */
 cacheOptions?: IConfigCacheOptions;

 /**
  * Controllers configuration options
  */
 controllersOptions?: IConfigControllersOptions;

 /**
  * Encryption configuration options
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

 /**
  * Whether to automatically create missing sections
  */
 shouldAutoCreateSections?: boolean;
}
