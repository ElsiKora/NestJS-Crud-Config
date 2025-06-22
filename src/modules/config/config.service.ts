import type { ICrudConfigProperties } from "@shared/interface/config";

import { Inject, Injectable, Logger } from "@nestjs/common";
import { CRUD_CONFIG_PROPERTIES } from "@shared/constant/config";
import { EEnvironment } from "@shared/enum";

import { ConfigDataService } from "./data/data.service";
import { IConfigGetProperties } from "./interface";
import { ConfigSectionService } from "./section/section.service";

/**
 * Path-based data object for compatibility with legacy code
 */
export interface ILegacyConfigData {
	application?: string;
	createdAt: Date;
	description?: string;
	environment?: string;
	id: string;
	isEncrypted: boolean;
	path: string;
	updatedAt: Date;
	value: string;
}

@Injectable()
export class CrudConfigService {
	private readonly DEFAULT_SECTION_NAME = "legacy-config";

	private readonly logger = new Logger(CrudConfigService.name);

	public constructor(
		@Inject(CRUD_CONFIG_PROPERTIES) private readonly properties: ICrudConfigProperties,
		private readonly sectionService: ConfigSectionService,
		private readonly dataService: ConfigDataService,
	) {
		if (properties.isVerbose) {
			this.logger.verbose("CrudConfigService initialized");
		}
	}

	/**
	 * Deletes a configuration by path
	 * @param {string | IConfigGetProperties} path - The config path or properties
	 * @returns {Promise<boolean>} Success status
	 */
	public async delete(path: IConfigGetProperties | string): Promise<boolean> {
		let configPath: string;
		let environment: string = this.getEnvironment();

		if (typeof path === "string") {
			configPath = path;
		} else {
			const { application = this.getApplication(), environment: propertyEnvironment = environment, path: pathSegments = [] } = path;

			environment = propertyEnvironment;
			configPath = `/${application}/${environment}/${pathSegments.join("/")}`;
		}

		if (this.properties.isVerbose) {
			this.logger.verbose(`Deleting config for path: ${configPath}`);
		}

		try {
			const section = await this.getOrCreateLegacySection();
			const name = this.pathToName(configPath);

			const configData = await this.dataService.get({
				where: {
					environment,
					name,
					sectionId: section.id,
				},
			});

			if (!configData) {
				return true; // Already doesn't exist
			}

			await this.dataService.delete({ id: configData.id });

			return true;
		} catch (error) {
			// @ts-ignore
			// eslint-disable-next-line @elsikora/typescript/restrict-template-expressions
			this.logger.error(`Error deleting config for path ${configPath}: ${error.message}`);

			return false;
		}
	}

	/**
	 * Retrieves a configuration value by path or properties
	 * @param {IConfigGetProperties | string} properties - The config path or properties
	 * @returns {Promise<string | null>} The configuration value or null if not found
	 */
	public async get(properties: IConfigGetProperties | string): Promise<null | string> {
		let path: string;
		let environment: string = this.getEnvironment();

		if (typeof properties === "string") {
			path = properties;
		} else {
			const { application = this.getApplication(), environment: propertyEnvironment = environment, path: pathSegments = [] } = properties;

			environment = propertyEnvironment;
			path = `/${application}/${environment}/${pathSegments.join("/")}`;
		}

		if (this.properties.isVerbose) {
			this.logger.verbose(`Getting config for path: ${path}`);
		}

		const section = await this.getOrCreateLegacySection();

		try {
			const name = this.pathToName(path);

			const configData = await this.dataService.get({
				where: {
					environment,
					name,
					sectionId: section.id,
				},
			});

			if (!configData) {
				return null;
			}

			// Handle decryption if needed
			if (configData.isEncrypted && this.properties.encryptionKey) {
				return this.decrypt(configData.value);
			}

			return configData.value;
		} catch (error) {
			// @ts-ignore
			// eslint-disable-next-line @elsikora/typescript/restrict-template-expressions
			this.logger.error(`Error getting config for path ${path}: ${error.message}`);

			return null;
		}
	}

	/**
	 * Gets the application name from properties or environment variables
	 * @returns {string} The application name
	 */
	public getApplication(): string {
		return this.properties.application || process.env.APPLICATION || "";
	}

	/**
	 * Gets the environment from properties or environment variables
	 * @returns {string} The environment name
	 */
	public getEnvironment(): string {
		return this.properties.environment || process.env.ENVIRONMENT || EEnvironment.PRODUCTION;
	}

	/**
	 * Lists configurations with optional filtering
	 * @param {Partial<IConfigGetProperties>} filter - Filter criteria
	 * @returns {Promise<Array<ILegacyConfigData>>} List of matching configurations
	 */
	public async list(filter: Partial<IConfigGetProperties> = {}): Promise<Array<ILegacyConfigData>> {
		const { application, environment } = filter;
		const where: any = {};

		if (environment) {
			where.environment = environment;
		}

		if (this.properties.isVerbose) {
			this.logger.verbose(`Listing configs with filter: ${JSON.stringify(filter)}`);
		}

		try {
			const section = await this.getOrCreateLegacySection();
			where.sectionId = section.id;

			const results = await this.dataService.getMany({ where });

			// Convert to legacy format
			return results.map((data) => {
				const appSegment = application || this.getApplication();
				const environmentSegment = data.environment || this.getEnvironment();
				const pathBase = `/${appSegment}/${environmentSegment}/`;
				const pathSuffix = data.name.replaceAll("_", "/");
				const fullPath = pathBase + pathSuffix;

				return this.dataToLegacyFormat(data, fullPath);
			});
		} catch (error) {
			// @ts-ignore
			// eslint-disable-next-line @elsikora/typescript/restrict-template-expressions
			this.logger.error(`Error listing configs: ${error.message}`);

			return [];
		}
	}

	/**
	 * Sets a configuration value
	 * @param {string | IConfigGetProperties} path - The config path or properties
	 * @param {string} value - The value to set
	 * @param {string | null} description - Optional description
	 * @returns {Promise<ILegacyConfigData>} The created or updated config entity
	 */
	public async set(path: IConfigGetProperties | string, value: string, description: null | string = null): Promise<ILegacyConfigData> {
		let configPath: string;
		let environment: string = this.getEnvironment();

		if (typeof path === "string") {
			configPath = path;
		} else {
			const { application = this.getApplication(), environment: propertyEnvironment = environment, path: pathSegments = [] } = path;

			environment = propertyEnvironment;
			configPath = `/${application}/${environment}/${pathSegments.join("/")}`;
		}

		if (this.properties.isVerbose) {
			this.logger.verbose(`Setting config for path: ${configPath}`);
		}

		const section = await this.getOrCreateLegacySection();
		const name = this.pathToName(configPath);

		// Handle encryption if needed
		let valueToStore = value;
		const shouldEncrypt = this.properties.shouldEncryptValues && this.properties.encryptionKey;

		if (shouldEncrypt) {
			valueToStore = this.encrypt(value);
		}

		try {
			// Check if config already exists
			const existingConfig = await this.dataService.get({
				where: {
					environment,
					name,
					sectionId: section.id,
				},
			});

			let result;

			if (existingConfig) {
				// Update existing config
				result = await this.dataService.update(
					{ id: existingConfig.id },
					{
						description: description === null ? existingConfig.description : description,
						isEncrypted: shouldEncrypt ? true : existingConfig.isEncrypted,
						value: valueToStore,
					},
				);
			} else {
				// Create new config
				result = await this.dataService.create({
					description: description || undefined,
					environment,
					isEncrypted: shouldEncrypt ? true : false,
					name,
					sectionId: section.id,
					value: valueToStore,
				});
			}

			return this.dataToLegacyFormat(result, configPath);
		} catch (error) {
			// @ts-ignore
			// eslint-disable-next-line @elsikora/typescript/restrict-template-expressions
			this.logger.error(`Error setting config for path ${configPath}: ${error.message}`);

			throw error;
		}
	}

	/**
	 * Converts config data to legacy format for backward compatibility
	 * @param data The data to convert
	 * @param path The original path
	 * @private
	 */
	private dataToLegacyFormat(data: any, path: string): ILegacyConfigData {
		return {
			application: "", // No direct equivalent in new model
			createdAt: data.createdAt,
			description: data.description,
			environment: data.environment,
			id: data.id,
			isEncrypted: data.isEncrypted,
			path,
			updatedAt: data.updatedAt,
			value: data.value,
		};
	}

	/**
	 * Simple decryption method (would be replaced with proper decryption in a real implementation)
	 * @param {string} value - Value to decrypt
	 * @returns {string} Decrypted value
	 * @private
	 */
	private decrypt(value: string): string {
		if (!this.properties.encryptionKey) {
			return value;
		}

		// Note: This is a simple implementation for demonstration purposes
		// In a real application, you would use a proper decryption library
		return Buffer.from(value, "base64").toString();
	}

	/**
	 * Simple encryption method (would be replaced with proper encryption in a real implementation)
	 * @param {string} value - Value to encrypt
	 * @returns {string} Encrypted value
	 * @private
	 */
	private encrypt(value: string): string {
		if (!this.properties.encryptionKey) {
			return value;
		}

		// Note: This is a simple implementation for demonstration purposes
		// In a real application, you would use a proper encryption library
		return Buffer.from(value).toString("base64");
	}

	/**
	 * Gets or creates the legacy config section
	 * @private
	 */
	private async getOrCreateLegacySection() {
		// Try to find the legacy section
		const existingSection = await this.sectionService.get({
			where: { name: this.DEFAULT_SECTION_NAME },
		});

		if (existingSection) {
			return existingSection;
		}

		// Create a new legacy section if it doesn't exist
		return this.sectionService.create({
			description: "Legacy configuration storage section for path-based configs",
			name: this.DEFAULT_SECTION_NAME,
		});
	}

	/**
	 * Converts legacy path to name format suitable for ConfigData
	 * @param path The legacy path to convert
	 * @private
	 */
	private pathToName(path: string): string {
		// Remove leading slash if present
		let name = path.startsWith("/") ? path.slice(1) : path;
		// Replace slashes with underscores
		name = name.replaceAll("/", "_");
		// Ensure name doesn't exceed the maximum length
		const maxLength = this.properties?.entityOptions?.configData?.maxNameLength || 128;

		if (name.length > maxLength) {
			name = name.slice(0, Math.max(0, maxLength));
		}

		return name;
	}
}
