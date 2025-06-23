import { ApiService, ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import { Injectable, Type, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";

/**
 * Factory to create dynamic service classes with the correct entity decorator
 */
export function createDynamicService(entity: any, serviceName: string): Type<any> {
  @ApiService({ entity })
  @Injectable()
  class DynamicService extends ApiServiceBase<any> {
    constructor(
      @Inject(getRepositoryToken(entity))
      public readonly repository: Repository<any>,
    ) {
      super();
    }
  }

  // Set the proper name for debugging
  Object.defineProperty(DynamicService, 'name', { value: serviceName });

  return DynamicService;
}