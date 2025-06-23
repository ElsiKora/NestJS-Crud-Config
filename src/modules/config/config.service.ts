import { EErrorStringAction, ErrorString } from "@elsikora/nestjs-crud-automator";
import { IConfigGetOptions } from "@modules/config/interface/get-properties.interface";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { HttpException, Inject, Injectable, InternalServerErrorException } from "@nestjs/common";

@Injectable()
export class CrudConfigService {
	constructor(
		@Inject("ConfigSectionService") private readonly sectionService: any,
		@Inject("ConfigDataService") private readonly dataService: any,
		// @ts-ignore
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) {}

	get(options: IConfigGetOptions): Promise<any> {
		const { environment, name, section, shouldDecrypt, shouldLoadSectionInfo }: IConfigGetOptions = options;

		return this.sectionService
			.get({ where: { name: section } })
			.then((section: any) => {
				return (
					this.dataService
						// eslint-disable-next-line @elsikora/typescript/naming-convention
						.get({ relations: { section: shouldLoadSectionInfo }, where: { environment, name, section: { id: section.id } } })
						.then((data: any) => {
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
								throw new InternalServerErrorException(ErrorString({ entity: "ConfigData", type: EErrorStringAction.FETCHING_ERROR }));
							}
						})
				);
			})
			.catch((error: unknown) => {
				if (error instanceof HttpException) {
					throw error;
				} else {
					throw new InternalServerErrorException(ErrorString({ entity: "ConfigSection", type: EErrorStringAction.FETCHING_ERROR }));
				}
			});
	}
}
