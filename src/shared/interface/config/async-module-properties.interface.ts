import type { ModuleMetadata, Type } from "@nestjs/common/interfaces";
import type {
 IConfigControllersOptions,
 IConfigOptions,
 IConfigPropertiesFactory,
} from "@shared/interface";
/**
 * Interface for asynchronous module configuration properties.
 * Provides different options for asynchronously configuring the Crud Config module.
 */
export interface ICrudConfigAsyncModuleProperties extends Pick<ModuleMetadata, "imports"> {
 /**
  * Static controllers configuration (required for sync registration).
  * NestJS does not support async controller registration.
  */
 controllersOptions?: IConfigControllersOptions;
 /** Optional array of dependencies to be injected into the factory function or class */
 inject?: Array<string | symbol | Type<unknown>>;
 /** Optional class that implements ICrudConfigPropertiesFactory to be instantiated */
 useClass?: Type<IConfigPropertiesFactory>;
 /** Optional existing provider implementing ICrudConfigPropertiesFactory to be used */
 useExisting?: Type<IConfigPropertiesFactory>;
 /** Optional factory function that returns configuration properties */
 // eslint-disable-next-line @elsikora/typescript/no-explicit-any
 useFactory?: (...arguments_: Array<any>) => IConfigOptions | Promise<IConfigOptions>;
}
