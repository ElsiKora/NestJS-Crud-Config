import type { ModuleMetadata, Type } from "@nestjs/common/interfaces";

import type { ICrudConfigPropertiesFactory } from "./properties-factory.interface";
import type { ICrudConfigProperties } from "./properties.interface";

/**
 * Interface for asynchronous module configuration properties.
 * Provides different options for asynchronously configuring the Crud Config module.
 */
export interface ICrudConfigAsyncModuleProperties extends Pick<ModuleMetadata, "imports"> {
	/** Optional array of dependencies to be injected into the factory function or class */
	inject?: Array<string | symbol | Type<unknown>>;
	/** Optional class that implements ICrudConfigPropertiesFactory to be instantiated */
	useClass?: Type<ICrudConfigPropertiesFactory>;
	/** Optional existing provider implementing ICrudConfigPropertiesFactory to be used */
	useExisting?: Type<ICrudConfigPropertiesFactory>;
	/** Optional factory function that returns configuration properties */
	useFactory?: (...arguments_: Array<unknown>) => ICrudConfigProperties | Promise<ICrudConfigProperties>;
}
