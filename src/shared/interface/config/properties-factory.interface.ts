import type { IConfigOptions } from "@shared/interface";

/**
 * Interface for a factory that creates Crud Config configuration properties.
 */
export interface IConfigPropertiesFactory {
 /**
  * Creates configuration options for the Crud Config module.
  * @returns {IConfigOptions | Promise<IConfigOptions>} Configuration properties or a Promise resolving to properties
  */
 createOptions(): IConfigOptions | Promise<IConfigOptions>;
}
