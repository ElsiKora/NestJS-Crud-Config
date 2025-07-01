import type { IConfigData } from "@modules/config/data";
import type { IConfigSection } from "@modules/config/section";
import type { IConfigOptions } from "@shared/interface/config";

import { ApiServiceBase, EErrorStringAction, ErrorString, IApiGetListResponseResult } from "@elsikora/nestjs-crud-automator";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException, Optional } from "@nestjs/common";
import { TOKEN_CONSTANT } from "@shared/constant";
import { CryptoUtility } from "@shared/utility";

import { IConfigDeleteOptions, IConfigGetListOptions, IConfigGetOptions, IConfigSetOptions } from "./interface";

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
		@Optional() @Inject(TOKEN_CONSTANT.CONFIG_OPTIONS) private readonly options?: IConfigOptions,
	) {}

	/**
	 * Deletes a configuration value
	 * @param {IConfigDeleteOptions} options Configuration options to identify the value to delete
	 * @returns {Promise<void>} Promise resolving when the configuration is deleted
	 */
	async delete(options: IConfigDeleteOptions): Promise<void> {
		const { environment, eventManager, name, section: sectionName }: IConfigDeleteOptions = options;
		const finalEnvironment: string = environment ?? this.options?.environment ?? "default";

		try {
			const section: IConfigSection = await this.sectionService.get({ where: { name: sectionName } }, eventManager);

			const data: IConfigData = await this.dataService.get(
				{
					where: {
						environment: finalEnvironment,
						name,
						section: { id: section.id },
					},
				},
				eventManager,
			);

			await this.dataService.delete({ id: data.id }, eventManager);

			// Invalidate cache for this specific config and the list
			const cacheKey: string = `config:${sectionName}:${name}:${finalEnvironment}`;
			const listCacheKey: string = `config:list:${sectionName}:${finalEnvironment}`;

			await Promise.all([this.cacheManager.del(cacheKey), this.cacheManager.del(listCacheKey)]);
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}

			throw new InternalServerErrorException(ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.DELETING_ERROR }));
		}
	}

	/**
	 * Retrieves configuration data based on the provided options
	 * @param {IConfigGetOptions} options Configuration retrieval options
	 * @returns {Promise<IConfigData>} Promise resolving to the configuration data
	 */
	async get(options: IConfigGetOptions): Promise<IConfigData> {
		const { environment, eventManager, name, section, shouldLoadSectionInfo, useCache }: IConfigGetOptions = options;
		const finalEnvironment: string = environment ?? this.options?.environment ?? "default";
		const cacheKey: string = `config:${section}:${name}:${finalEnvironment}`;

		try {
			// Check cache first if enabled
			if (useCache && this.options?.cacheOptions?.isEnabled) {
				const cachedData: IConfigData | undefined = await this.cacheManager.get<IConfigData>(cacheKey);

				if (cachedData) {
					return cachedData;
				}
			}

			// Fetch section
			const sectionData: IConfigSection = await this.sectionService.get({ where: { name: section } }, eventManager);

			// Fetch configuration data
			const data: IConfigData = await this.dataService.get(
				{
					// eslint-disable-next-line @elsikora/typescript/naming-convention
					relations: { section: shouldLoadSectionInfo },
					where: { environment: finalEnvironment, name, section: { id: sectionData.id } },
				},
				eventManager,
			);

			// Decrypt if necessary
			if (data.isEncrypted) {
				if (!this.options?.encryptionOptions?.encryptionKey) {
					throw new InternalServerErrorException(ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.KEY_NOT_FOUND }));
				}

				try {
					data.value = CryptoUtility.decrypt(data.value, this.options.encryptionOptions.encryptionKey);
				} catch {
					throw new InternalServerErrorException(ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.DECRYPTION_ERROR }));
				}
			}

			// Cache the result if caching is enabled
			if (useCache && this.options?.cacheOptions?.isEnabled) {
				const ttl: number | undefined = this.options.cacheOptions.maxCacheTTL;
				await this.cacheManager.set(cacheKey, data, ttl);
			}

			return data;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}

			throw new InternalServerErrorException(ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.FETCHING_ERROR }));
		}
	}

	/**
	 * Lists all configuration values in a section.
	 * Supports caching and running within a TypeORM transaction.
	 * @param {IConfigGetListOptions} options Options for listing configurations.
	 * @returns {Promise<Array<IConfigData>>} Promise resolving to an array of configuration data.
	 */
	async getList(options: IConfigGetListOptions): Promise<Array<IConfigData>> {
		const { environment, eventManager, section: sectionName, useCache }: IConfigGetListOptions = options;
		const finalEnvironment: string = environment ?? this.options?.environment ?? "default";
		const cacheKey: string = `config:list:${sectionName}:${finalEnvironment}`;

		try {
			// Check cache first if enabled
			if (useCache && this.options?.cacheOptions?.isEnabled) {
				const cachedItems: Array<IConfigData> | undefined = await this.cacheManager.get<Array<IConfigData>>(cacheKey);

				if (cachedItems) {
					return cachedItems;
				}
			}

			// Fetch section and data
			const section: IConfigSection = await this.sectionService.get({ where: { name: sectionName } }, eventManager);

			const result: IApiGetListResponseResult<IConfigData> = await this.dataService.getList({ where: { environment: finalEnvironment, section: { id: section.id } } }, eventManager);

			if (useCache && this.options?.cacheOptions?.isEnabled) {
				const ttl: number | undefined = this.options?.cacheOptions?.maxCacheTTL;
				await this.cacheManager.set(cacheKey, result.items, ttl);
			}

			return result.items;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}

			throw new InternalServerErrorException(ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.FETCHING_LIST_ERROR }));
		}
	}

	/**
	 * Sets a configuration value with optional encryption.
	 * The specified section must already exist.
	 * If a configuration with the same name and environment already exists, it will be updated. Otherwise, a new one will be created.
	 * @param {IConfigSetOptions} options Configuration set options
	 * @returns {Promise<IConfigData>} Promise resolving to the saved configuration data
	 */
	async set(options: IConfigSetOptions): Promise<IConfigData> {
		const { description, environment, eventManager, name, section: sectionName, value }: IConfigSetOptions = options;
		const finalEnvironment: string = environment ?? this.options?.environment ?? "default";

		const shouldApplyEncryption: boolean = this.options?.encryptionOptions?.isEnabled ?? false;
		let finalValue: string = value;
		let isEncrypted: boolean = false;

		if (shouldApplyEncryption) {
			if (!this.options?.encryptionOptions?.encryptionKey) {
				throw new InternalServerErrorException(ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.KEY_NOT_FOUND }));
			}

			try {
				finalValue = CryptoUtility.encrypt(value, this.options.encryptionOptions.encryptionKey);
				isEncrypted = true;
			} catch {
				throw new InternalServerErrorException(ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.ENCRYPTION_ERROR }));
			}
		}

		try {
			// Fetch section
			const section: IConfigSection = await this.sectionService.get({ where: { name: sectionName } }, eventManager);

			const configData: Partial<IConfigData> = {
				description: description ?? undefined,
				environment: finalEnvironment,
				isEncrypted,
				name,
				section: { id: section.id },
				value: finalValue,
			};

			let result: IConfigData;

			try {
				// Try to update existing configuration
				const existingData: IConfigData = await this.dataService.get({ where: { environment: finalEnvironment, name, section: { id: section.id } } }, eventManager);

				result = await this.dataService.update({ id: existingData.id }, configData, eventManager);
			} catch (error) {
				if (error instanceof NotFoundException) {
					// Create new configuration if not found
					result = await this.dataService.create(configData, eventManager);
				} else {
					throw error;
				}
			}

			// Invalidate cache for this specific config and the list
			const cacheKey: string = `config:${sectionName}:${name}:${finalEnvironment}`;
			const listCacheKey: string = `config:list:${sectionName}:${finalEnvironment}`;

			await Promise.all([this.cacheManager.del(cacheKey), this.cacheManager.del(listCacheKey)]);

			return result;
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}

			throw new InternalServerErrorException(ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.CREATING_ERROR }));
		}
	}
}
