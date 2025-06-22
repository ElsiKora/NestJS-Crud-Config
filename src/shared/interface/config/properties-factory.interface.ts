import type { ICrudConfigProperties } from "./properties.interface";

/**
 * Interface for a factory that creates Crud Config configuration properties.
 */
export interface ICrudConfigPropertiesFactory {
	/**
	 * Creates configuration options for the Crud Config module.
	 * @returns {ICrudConfigProperties | Promise<ICrudConfigProperties>} Configuration properties or a Promise resolving to properties
	 */
	createOptions(): ICrudConfigProperties | Promise<ICrudConfigProperties>;
}
