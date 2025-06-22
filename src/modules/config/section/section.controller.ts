import { ApiController, EApiRouteType, IApiControllerBase, IApiControllerProperties } from "@elsikora/nestjs-crud-automator";
import { ConfigSection } from "@modules/config/section/entity/section.entity";

import { ConfigSectionService } from "./section.service";

const config: IApiControllerProperties<ConfigSection> = {
	entity: ConfigSection,
	name: "ConfigSection",
	path: "ConfigSection",
	routes: {
		[EApiRouteType.CREATE]: {
			isEnabled: true,
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

@ApiController<ConfigSection>(config)
export default class ConfigSectionController implements IApiControllerBase<ConfigSection> {
	constructor(public service: ConfigSectionService) {}
}
