import { ApiServiceBase, EErrorStringAction, ErrorString } from "@elsikora/nestjs-crud-automator";
import type { IConfigData } from "@modules/config/data";
import type { IConfigGetOptions } from "@modules/config/interface/get-properties.interface";
import type { IConfigSetOptions } from "@modules/config/interface/set-properties.interface";
import type { IConfigSection } from "@modules/config/section";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { HttpException, Inject, Injectable, InternalServerErrorException, Optional } from "@nestjs/common";
import { TOKEN_CONSTANT } from "@shared/constant";
import type { ICrudConfigProperties } from "@shared/interface/config";
import { CryptoUtility } from "@shared/utility";

/**
 * Service for managing configuration data with caching support
 * Provides methods to retrieve configuration values with optional decryption
 */
@Injectable()
export class CrudConfigService {
	constructor(
		@Inject(TOKEN_CONSTANT.CONFIG_SECTION_SERVICE) private readonly sectionService: ApiServiceBase<IConfigSection>,
		@Inject(TOKEN_CONSTANT.CONFIG_DATA_SERVICE) private readonly dataService: ApiServiceBase<IConfigData>,
		// @ts-ignore
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		@Optional() @Inject(TOKEN_CONSTANT.CONFIG_PROPERTIES) private readonly properties?: ICrudConfigProperties,
	) {}

	/**
	 * Retrieves configuration data based on the provided options
	 * @param {IConfigGetOptions} options Configuration retrieval options
	 * @returns {Promise<IConfigData>} Promise resolving to the configuration data
	 */
	async get(options: IConfigGetOptions): Promise<IConfigData> {
		const { environment, name, section, shouldDecrypt, shouldLoadSectionInfo }: IConfigGetOptions = options;

		return this.sectionService
			.get({ where: { name: section } })
			.then((section: IConfigSection): Promise<IConfigData> => {
				return (
					this.dataService
						// eslint-disable-next-line @elsikora/typescript/naming-convention
						.get({ relations: { section: shouldLoadSectionInfo }, where: { environment, name, section: { id: section.id } } })
						.then((data: IConfigData): IConfigData => {
							if (data.isEncrypted && shouldDecrypt) {
								// Decrypt the value if encryption is enabled and decryption is requested
								if (this.properties?.encryptionKey) {
									try {
										data.value = CryptoUtility.decrypt(data.value, this.properties.encryptionKey);
									} catch (error) {
										throw new InternalServerErrorException(
											`Failed to decrypt configuration value: ${error instanceof Error ? error.message : "Unknown error"}`
										);
									}
								} else {
									throw new InternalServerErrorException(
										"Cannot decrypt value: encryption key is not configured"
									);
								}
								return data;
							} else {
								return data;
							}
						})
						.catch((error: unknown) => {
							if (error instanceof HttpException) {
								throw error;
							} else {
								throw new InternalServerErrorException(ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.FETCHING_ERROR }));
							}
						})
				);
			})
			.catch((error: unknown) => {
				if (error instanceof HttpException) {
					throw error;
				} else {
					throw new InternalServerErrorException(ErrorString({ entity: { name: "ConfigSection" }, type: EErrorStringAction.FETCHING_ERROR }));
				}
			});
	}

	/**
	 * Sets a configuration value with optional encryption
	 * @param {IConfigSetOptions} options Configuration set options
	 * @param {string} value The value to set
	 * @returns {Promise<IConfigData>} Promise resolving to the saved configuration data
	 */
	async set(options: IConfigSetOptions, value: string): Promise<IConfigData> {
		const { environment, name, section: sectionName, shouldEncrypt, description }: IConfigSetOptions = options;
		
		// Determine if encryption should be applied
		const shouldApplyEncryption = shouldEncrypt ?? this.properties?.shouldEncryptValues ?? false;
		let finalValue = value;
		let isEncrypted = false;

		// Encrypt the value if needed
		if (shouldApplyEncryption) {
			if (!this.properties?.encryptionKey) {
				throw new InternalServerErrorException(
					"Cannot encrypt value: encryption key is not configured"
				);
			}
			try {
				finalValue = CryptoUtility.encrypt(value, this.properties.encryptionKey);
				isEncrypted = true;
			} catch (error) {
				throw new InternalServerErrorException(
					`Failed to encrypt configuration value: ${error instanceof Error ? error.message : "Unknown error"}`
				);
			}
		}

		try {
			// First, find or create the section
			let section: IConfigSection;
			try {
				section = await this.sectionService.get({ where: { name: sectionName } });
			} catch (error) {
				// Section doesn't exist, create it
				section = await this.sectionService.create({
					name: sectionName,
					description: `Section for ${sectionName} configurations`,
				});
			}

			// Check if the configuration already exists
			let existingData: IConfigData | null = null;
			try {
				existingData = await this.dataService.get({
					where: {
						environment: environment ?? this.properties?.environment ?? "default",
						name,
						section: { id: section.id },
					},
				});
			} catch {
				// Configuration doesn't exist, which is fine
			}

			const configData = {
				name,
				value: finalValue,
				environment: environment ?? this.properties?.environment ?? "default",
				description: description ?? undefined,
				isEncrypted,
				section: { id: section.id },
			};

			// Create or update the configuration
			if (existingData) {
				// Update existing configuration
				return await this.dataService.update({ id: existingData.id } as any, configData);
			} else {
				// Create new configuration
				return await this.dataService.create(configData);
			}
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new InternalServerErrorException(
					ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.CREATING_ERROR })
				);
			}
		}
	}

	/**
	 * Deletes a configuration value
	 * @param {IConfigGetOptions} options Configuration options to identify the value to delete
	 * @returns {Promise<void>} Promise resolving when the configuration is deleted
	 */
	async delete(options: Omit<IConfigGetOptions, "shouldDecrypt" | "shouldLoadSectionInfo">): Promise<void> {
		const { environment, name, section: sectionName }: IConfigGetOptions = options;

		try {
			const section = await this.sectionService.get({ where: { name: sectionName } });
			const data = await this.dataService.get({
				where: {
					environment: environment ?? this.properties?.environment ?? "default",
					name,
					section: { id: section.id },
				},
			});

			await this.dataService.delete({ id: data.id } as any);
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new InternalServerErrorException(
					ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.DELETING_ERROR })
				);
			}
		}
	}

	/**
	 * Lists all configuration values in a section
	 * @param {object} options Options for listing configurations
	 * @param {string} options.section Section name
	 * @param {string} [options.environment] Environment name
	 * @returns {Promise<Array<IConfigData>>} Promise resolving to array of configuration data
	 */
	async list(options: { section: string; environment?: string }): Promise<Array<IConfigData>> {
		const { section: sectionName, environment } = options;

		try {
			const section = await this.sectionService.get({ where: { name: sectionName } });
			const where: any = { section: { id: section.id } };
			
			if (environment) {
				where.environment = environment;
			}

			const result = await this.dataService.getList({ where });
			return result.items;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			} else {
				throw new InternalServerErrorException(
					ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.FETCHING_ERROR })
				);
			}
		}
	}
}
