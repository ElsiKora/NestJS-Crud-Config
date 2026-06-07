import type { IApiBaseEntity, IApiControllerProperties } from "@elsikora/nestjs-crud-automator";
import type { IConfigData } from "@modules/config/data";
import type { IConfigSection } from "@modules/config/section";

/**
 * Interface for individual controller configuration
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/config-controller-options | API Reference - IConfigControllerOptions}
 */
export interface IConfigControllerOptions<T extends IApiBaseEntity = IApiBaseEntity> {
 /**
  * Whether the controller is enabled (default: true)
  */
 isEnabled?: boolean;

 /**
  * Controller properties from crud automator
  * Includes name, path, routes, swagger, and all other options
  */
 properties?: Partial<IApiControllerProperties<T>>;
}

/**
 * Interface for controllers configuration
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/config-controllers-options | API Reference - IConfigControllersOptions}
 */
export interface IConfigControllersOptions {
 /**
  * Configuration for the data controller
  */
 data?: IConfigControllerOptions<IConfigData>;

 /**
  * Configuration for the section controller
  */
 section?: IConfigControllerOptions<IConfigSection>;
}
