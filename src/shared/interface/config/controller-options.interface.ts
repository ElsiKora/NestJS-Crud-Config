import type { IApiControllerProperties } from "@elsikora/nestjs-crud-automator";

/**
 * Interface for individual controller configuration
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
