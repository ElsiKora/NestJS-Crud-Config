import { ApiService, ApiServiceBase, IApiBaseEntity } from "@elsikora/nestjs-crud-automator";
import { Inject, Injectable, Type } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { TDynamicEntity } from "@shared/type";
import { Repository } from "typeorm";

/**
 * Factory to create dynamic service classes with the correct entity decorator
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/utilities/create-dynamic-service | API Reference - createDynamicService}
 * @param {TDynamicEntity} entity The entity type to create service for
 * @param {string} name The name for the service class
 * @returns {Type} The dynamic service class
 */
export function createDynamicService(entity: TDynamicEntity, name: string): Type {
 @ApiService({ entity })
 @Injectable()
 class DynamicService extends ApiServiceBase<IApiBaseEntity> {
  constructor(
   @Inject(getRepositoryToken(entity))
   public readonly repository: Repository<IApiBaseEntity>,
  ) {
   super();
  }
 }

 Object.defineProperty(DynamicService, "name", { value: name });

 return DynamicService;
}
