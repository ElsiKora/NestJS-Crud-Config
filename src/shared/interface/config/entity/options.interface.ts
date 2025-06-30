import type { IConfigEntityDataOptions, IConfigEntitySectionOptions } from "./";

/**
 * Interface for entity customization options
 */
export interface ICrudConfigEntityOptions {
	/**
	 * ConfigData entity options
	 */
	configData?: IConfigEntityDataOptions;

	/**
	 * ConfigSection entity options
	 */
	configSection?: IConfigEntitySectionOptions;

	/**
	 * Table name prefix for all entities
	 */
	tablePrefix?: string;
}
