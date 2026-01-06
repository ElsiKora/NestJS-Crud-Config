import type { ModuleMetadata, Type } from "@nestjs/common/interfaces";

import type { IConfigOptions } from "./options.interface";
import type { IConfigPropertiesFactory } from "./properties-factory.interface";
import type { IConfigStaticOptions } from "./static-options.interface";

/**
 * Interface for asynchronous module configuration properties.
 * Provides different options for asynchronously configuring the Crud Config module.
 *
 * When using `registerAsync()`, some options must be provided statically via `staticOptions`
 * because NestJS does not support async controller registration. The `staticOptions` property
 * allows you to configure controllers and entities that need to be known at module compilation time.
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/core-concepts/module-registration | Core Concepts - Module Registration}
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/crud-config-async-module-properties | API Reference - ICrudConfigAsyncModuleProperties}
 * @example
 * ```typescript
 * CrudConfigModule.registerAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     encryptionOptions: { isEnabled: true, encryptionKey: config.get('KEY') },
 *     cacheOptions: { isEnabled: true, maxCacheTTL: 3600000 },
 *   }),
 *   staticOptions: {
 *     controllersOptions: { section: { isEnabled: true }, data: { isEnabled: true } },
 *     entityOptions: { tablePrefix: 'app_' },
 *   },
 * });
 * ```
 */
export interface ICrudConfigAsyncModuleProperties extends Pick<ModuleMetadata, "imports"> {
 /** Optional array of dependencies to be injected into the factory function or class */
 inject?: Array<string | symbol | Type<unknown>>;

 /**
  * Static options that must be known at module registration time.
  * Use this to configure controllers and entities when using async registration.
  *
  * NestJS does not support async controller registration, so `controllersOptions`
  * and `entityOptions` must be provided here rather than in the async factory.
  */
 staticOptions?: IConfigStaticOptions;

 /** Optional class that implements ICrudConfigPropertiesFactory to be instantiated */
 useClass?: Type<IConfigPropertiesFactory>;

 /** Optional existing provider implementing ICrudConfigPropertiesFactory to be used */
 useExisting?: Type<IConfigPropertiesFactory>;

 /** Optional factory function that returns configuration properties */
 // eslint-disable-next-line @elsikora/typescript/no-explicit-any
 useFactory?: (...arguments_: Array<any>) => IConfigOptions | Promise<IConfigOptions>;
}
