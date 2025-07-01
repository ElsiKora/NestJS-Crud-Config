import { ApiController, ApiServiceBase, EApiControllerLoadRelationsStrategy, EApiRouteType, IApiControllerBase, IApiControllerProperties } from "@elsikora/nestjs-crud-automator";
import { Inject } from "@nestjs/common";
import { Type } from "@nestjs/common/interfaces";
import { TOKEN_CONSTANT } from "@shared/constant";
import { IConfigControllerOptions } from "@shared/interface/config";
import { TDynamicEntity } from "@shared/type";

/**
 * Factory to create dynamic ConfigData controller with the correct entity
 * @param {TDynamicEntity} entity The entity type to create controller for
 * @param {IConfigControllerOptions} [options] Controller configuration options
 * @returns {Type} The dynamic controller class
 */
export function createDynamicDataController(entity: TDynamicEntity, options?: IConfigControllerOptions): Type {
	const defaultConfig: IApiControllerProperties<typeof entity> = {
		entity,
		name: "ConfigData",
		path: "config/data",
		routes: {
			[EApiRouteType.CREATE]: {
				isEnabled: true,
				request: {
					relations: {
						relationsLoadStrategy: EApiControllerLoadRelationsStrategy.MANUAL,
						relationsServices: {
							section: "sectionService",
						},
						relationsToLoad: ["section" as keyof typeof entity],
						servicesLoadStrategy: EApiControllerLoadRelationsStrategy.MANUAL,
						shouldLoadRelations: true,
					},
				},
			},
			[EApiRouteType.DELETE]: { isEnabled: true },
			[EApiRouteType.GET]: { isEnabled: true },
			[EApiRouteType.GET_LIST]: { isEnabled: true },
			[EApiRouteType.UPDATE]: {
				isEnabled: true,
				request: {
					relations: {
						relationsLoadStrategy: EApiControllerLoadRelationsStrategy.MANUAL,
						relationsServices: {
							section: "sectionService",
						},
						relationsToLoad: ["section" as keyof typeof entity],
						servicesLoadStrategy: EApiControllerLoadRelationsStrategy.MANUAL,
						shouldLoadRelations: true,
					},
				},
			},
		},
	};

	const config: IApiControllerProperties<typeof entity> = {
		...defaultConfig,
		...options?.properties,
	};

	@ApiController(config)
	class DynamicConfigDataController implements IApiControllerBase<typeof entity> {
		constructor(
			@Inject(TOKEN_CONSTANT.CONFIG_DATA_SERVICE) public readonly service: ApiServiceBase<typeof entity>,
			@Inject(TOKEN_CONSTANT.CONFIG_SECTION_SERVICE) public readonly sectionService: ApiServiceBase<typeof entity>,
		) {}
	}

	return DynamicConfigDataController;
}
