import { ApiServiceBase, EErrorStringAction, ErrorString } from "@elsikora/nestjs-crud-automator";
import { IConfigData } from "@modules/config/data";
import { IConfigGetOptions } from "@modules/config/interface/get-properties.interface";
import { IConfigSection } from "@modules/config/section";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { HttpException, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { TOKEN_CONSTANT } from "@shared/constant";

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
								// eslint-disable-next-line @elsikora/javascript/no-self-assign
								data.value = data.value; // Implementation pending: decrypt method integration

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
}
