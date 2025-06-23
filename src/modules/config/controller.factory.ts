import { ApiController, IApiControllerBase, IApiControllerProperties, EApiControllerLoadRelationsStrategy, EApiRouteType } from "@elsikora/nestjs-crud-automator";
import { Controller, Inject, Type } from "@nestjs/common";
// ConfigDataService and ConfigSectionService are provided dynamically

/**
 * Factory to create dynamic ConfigSection controller with the correct entity
 */
export function createDynamicSectionController(entity: any): Type<any> {
  const config: IApiControllerProperties<any> = {
    entity: entity,
    name: "ConfigSection",
    path: "config-section",
    routes: {
      [EApiRouteType.CREATE]: { isEnabled: true },
      [EApiRouteType.DELETE]: { isEnabled: true },
      [EApiRouteType.GET]: { isEnabled: true },
      [EApiRouteType.GET_LIST]: { isEnabled: true },
      [EApiRouteType.UPDATE]: { isEnabled: true },
    },
  };

  @ApiController(config)
  @Controller(config.path!)
  class DynamicConfigSectionController implements IApiControllerBase<any> {
    constructor(
      @Inject('ConfigSectionService') public readonly service: any,
    ) {}
  }

  return DynamicConfigSectionController;
}

/**
 * Factory to create dynamic ConfigData controller with the correct entity
 */
export function createDynamicDataController(entity: any): Type<any> {
  const config: IApiControllerProperties<any> = {
    entity: entity,
    name: "ConfigData",
    path: "config-data",
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
            relationsToLoad: ["section"],
            servicesLoadStrategy: EApiControllerLoadRelationsStrategy.MANUAL,
            shouldLoadRelations: true,
          },
        },
      },
    },
  };

  @ApiController(config)
  @Controller(config.path!)
  class DynamicConfigDataController implements IApiControllerBase<any> {
    constructor(
      @Inject('ConfigDataService') public readonly service: any,
      @Inject('sectionService') public readonly sectionService: any,
    ) {}
  }

  return DynamicConfigDataController;
}