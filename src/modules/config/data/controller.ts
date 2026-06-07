import type { IConfigData } from "@modules/config/data";
import type { IConfigSection } from "@modules/config/section";

import {
 ApiController,
 ApiServiceBase,
 EApiControllerRelationReferenceShape,
 EApiRouteType,
 IApiControllerBase,
 IApiControllerProperties,
} from "@elsikora/nestjs-crud-automator";
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
export function createDynamicDataController(
 entity: TDynamicEntity<IConfigData>,
 options?: IConfigControllerOptions<IConfigData>,
): Type {
 const defaultConfig: IApiControllerProperties<IConfigData> = {
  entity,
  name: "ConfigData",
  path: "config/data",
  routes: {
   [EApiRouteType.CREATE]: {
    generation: { isEnabled: true },
    relations: {
     request: {
      load: {
       include: {
        // eslint-disable-next-line @elsikora/typescript/naming-convention
        section: true,
       },
       relationLoadStrategy: "query",
      },
      reference: {
       key: "id",
       shape: EApiControllerRelationReferenceShape.OBJECT,
      },
     },
    },
   },
   [EApiRouteType.DELETE]: { generation: { isEnabled: true } },
   [EApiRouteType.GET]: { generation: { isEnabled: true } },
   [EApiRouteType.GET_LIST]: { generation: { isEnabled: true } },
   [EApiRouteType.UPDATE]: {
    generation: { isEnabled: true },
    relations: {
     request: {
      load: {
       include: {
        // eslint-disable-next-line @elsikora/typescript/naming-convention
        section: true,
       },
       relationLoadStrategy: "query",
      },
      reference: {
       key: "id",
       shape: EApiControllerRelationReferenceShape.OBJECT,
      },
     },
    },
   },
  },
 };

 const customRoutes: IApiControllerProperties<IConfigData>["routes"] | undefined =
  options?.properties?.routes;

 const createRoute: IApiControllerProperties<IConfigData>["routes"][EApiRouteType.CREATE] =
  Object.assign(
   {},
   defaultConfig.routes[EApiRouteType.CREATE],
   customRoutes?.[EApiRouteType.CREATE],
   {
    generation: {
     ...defaultConfig.routes[EApiRouteType.CREATE]?.generation,
     ...customRoutes?.[EApiRouteType.CREATE]?.generation,
    },
   },
  );

 const deleteRoute: IApiControllerProperties<IConfigData>["routes"][EApiRouteType.DELETE] =
  Object.assign(
   {},
   defaultConfig.routes[EApiRouteType.DELETE],
   customRoutes?.[EApiRouteType.DELETE],
   {
    generation: {
     ...defaultConfig.routes[EApiRouteType.DELETE]?.generation,
     ...customRoutes?.[EApiRouteType.DELETE]?.generation,
    },
   },
  );

 const getRoute: IApiControllerProperties<IConfigData>["routes"][EApiRouteType.GET] = Object.assign(
  {},
  defaultConfig.routes[EApiRouteType.GET],
  customRoutes?.[EApiRouteType.GET],
  {
   generation: {
    ...defaultConfig.routes[EApiRouteType.GET]?.generation,
    ...customRoutes?.[EApiRouteType.GET]?.generation,
   },
  },
 );

 const getListRoute: IApiControllerProperties<IConfigData>["routes"][EApiRouteType.GET_LIST] =
  Object.assign(
   {},
   defaultConfig.routes[EApiRouteType.GET_LIST],
   customRoutes?.[EApiRouteType.GET_LIST],
   {
    generation: {
     ...defaultConfig.routes[EApiRouteType.GET_LIST]?.generation,
     ...customRoutes?.[EApiRouteType.GET_LIST]?.generation,
    },
   },
  );

 const updateRoute: IApiControllerProperties<IConfigData>["routes"][EApiRouteType.UPDATE] =
  Object.assign(
   {},
   defaultConfig.routes[EApiRouteType.UPDATE],
   customRoutes?.[EApiRouteType.UPDATE],
   {
    generation: {
     ...defaultConfig.routes[EApiRouteType.UPDATE]?.generation,
     ...customRoutes?.[EApiRouteType.UPDATE]?.generation,
    },
   },
  );

 const config: IApiControllerProperties<IConfigData> = {
  ...defaultConfig,
  ...options?.properties,
  routes: {
   ...defaultConfig.routes,
   ...customRoutes,
   [EApiRouteType.CREATE]: createRoute,
   [EApiRouteType.DELETE]: deleteRoute,
   [EApiRouteType.GET]: getRoute,
   [EApiRouteType.GET_LIST]: getListRoute,
   [EApiRouteType.UPDATE]: updateRoute,
  },
 };

 @ApiController(config)
 class DynamicConfigDataController implements IApiControllerBase<IConfigData> {
  constructor(
   @Inject(TOKEN_CONSTANT.CONFIG_DATA_SERVICE)
   public readonly service: ApiServiceBase<IConfigData>,
   @Inject(TOKEN_CONSTANT.CONFIG_SECTION_SERVICE)
   public readonly sectionService: ApiServiceBase<IConfigSection>,
  ) {}
 }

 return DynamicConfigDataController;
}
