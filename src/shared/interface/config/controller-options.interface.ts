import type { IApiControllerProperties } from "@elsikora/nestjs-crud-automator";

/**
 * Interface for individual controller configuration
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/config-controller-options | API Reference - IConfigControllerOptions}
 */
export interface IConfigControllerOptions<T = unknown> {
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
 data?: IConfigControllerOptions;

 /**
  * Configuration for the section controller
  */
 section?: IConfigControllerOptions;
}
