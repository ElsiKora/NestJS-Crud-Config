import { EErrorStringAction, ErrorString } from "@elsikora/nestjs-crud-automator";
import { ConfigData, ConfigDataService } from "@modules/config/data";
import { IConfigGetOptions } from "@modules/config/interface/get-properties.interface";
import { ConfigSection, ConfigSectionService } from "@modules/config/section";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { HttpException, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";

@Injectable()
export class CrudConfigService {
	constructor(
		private readonly sectionService: ConfigSectionService,
		private readonly dataService: ConfigDataService,
		// @ts-ignore
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {}

	get(options: IConfigGetOptions): Promise<ConfigData> {
		const { environment, name, section, shouldDecrypt, shouldLoadSectionInfo }: IConfigGetOptions = options;

		return this.sectionService
			.get({ where: { name: section } })
			.then((section: ConfigSection) => {
				return (
					this.dataService
						// eslint-disable-next-line @elsikora/typescript/naming-convention
						.get({ relations: { section: shouldLoadSectionInfo }, where: { environment, name, section: { id: section.id } } })
						.then((data: ConfigData) => {
							if (data.isEncrypted && shouldDecrypt) {
								// eslint-disable-next-line @elsikora/javascript/no-self-assign
								data.value = data.value; // TODO: decrypt

								return data;
							} else {
								return data;
							}
						})
						.catch((error: unknown) => {
							if (error instanceof HttpException) {
								throw error;
							} else {
								throw new InternalServerErrorException(ErrorString({ entity: ConfigData, type: EErrorStringAction.FETCHING_ERROR }));
							}
						})
				);
			})
			.catch((error: unknown) => {
				if (error instanceof HttpException) {
					throw error;
				} else {
					throw new InternalServerErrorException(ErrorString({ entity: ConfigSection, type: EErrorStringAction.FETCHING_ERROR }));
				}
			});
	}
}
