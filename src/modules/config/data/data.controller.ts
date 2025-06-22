import { ApiController, EApiControllerLoadRelationsStrategy, EApiRouteType, IApiControllerBase, IApiControllerProperties } from "@elsikora/nestjs-crud-automator";
import { ConfigSectionService } from "@modules/config";
import { ConfigData } from "@modules/config/data/entity/data.entity";

import { ConfigDataService } from "./data.service";

const config: IApiControllerProperties<ConfigData> = {
	entity: ConfigData,
	name: "ConfigData",
	path: "ConfigData",
	routes: {
		[EApiRouteType.CREATE]: {
			isEnabled: true,
			request: {
				relations: {
					relationsLoadStrategy: EApiControllerLoadRelationsStrategy.MANUAL,
					relationsServices: {
						section: "sectionService",
					},
					relationsToLoad: ["section"],
					servicesLoadStrategy: EApiControllerLoadRelationsStrategy.MANUAL,
					shouldLoadRelations: true,
				},
			},
		},
		[EApiRouteType.DELETE]: {
			isEnabled: true,
		},
		[EApiRouteType.GET]: {
			isEnabled: true,
		},
		[EApiRouteType.GET_LIST]: {
			isEnabled: true,
		},
		[EApiRouteType.PARTIAL_UPDATE]: {
			isEnabled: true,
		},
		[EApiRouteType.UPDATE]: {
			isEnabled: true,
		},
	},
};

@ApiController<ConfigData>(config)
export class ConfigDataController implements IApiControllerBase<ConfigData> {
	constructor(
		public service: ConfigDataService,
		public sectionService: ConfigSectionService,
	) {}
}
