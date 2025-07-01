import type { IConfigData } from "@modules/config/data";
import type { TDynamicEntity } from "@shared/type";
import type { EntitySubscriberInterface, InsertEvent } from "typeorm";

import { EErrorStringAction } from "@elsikora/nestjs-crud-automator";
import { ErrorString } from "@elsikora/nestjs-crud-automator";
import { ConfigDataEventBeforeInsert } from "@modules/config/data/event";
import { HttpException, Inject, InternalServerErrorException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { TOKEN_CONSTANT } from "@shared/constant";
import { DataSource, EventSubscriber } from "typeorm";

/**
 * TypeORM subscriber for ConfigData beforeInsert event
 * Note: Works with dynamically generated entities
 */
@EventSubscriber()
export class ConfigDataBeforeInsertSubscriber implements EntitySubscriberInterface<IConfigData> {
 constructor(
  private readonly eventEmitter: EventEmitter2,
  @Inject(DataSource) readonly connection: DataSource,
  @Inject(TOKEN_CONSTANT.CONFIG_DATA_ENTITY) private readonly entityClass: TDynamicEntity,
 ) {
  // Register this subscriber with the DataSource
  connection.subscribers.push(this);
 }

 /**
  * Handle the beforeInsert event
  * @param {InsertEvent<IConfigData>} event - The TypeORM insert event
  * @returns {Promise<boolean>} Promise resolving to boolean indicating success
  */
 beforeInsert(event: InsertEvent<IConfigData>): Promise<boolean> {
  // Only process if this is our ConfigData entity
  if (event.entity.constructor !== this.entityClass) {
   return Promise.resolve(true);
  }

  const item: IConfigData = event.entity;

  const payload: ConfigDataEventBeforeInsert = new ConfigDataEventBeforeInsert();
  payload.item = item;
  payload.eventManager = event.manager;

  return this.eventEmitter
   .emitAsync("config-data.beforeInsert", payload)
   .then((result: Array<{ error?: unknown; isSuccess: boolean }>) => {
    if (result.every((item: { error?: unknown; isSuccess: boolean }) => item.isSuccess)) {
     return true;
    } else {
     const error: unknown = result.find(
      (item: { error?: unknown; isSuccess: boolean }) => !item.isSuccess,
     )?.error;

     if (error instanceof HttpException) {
      throw error;
     }

     // @ts-ignore - EErrorStringAction import issue with yalc package
     throw new InternalServerErrorException(
      ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.CREATING_ERROR }),
     );
    }
   })
   .catch((error: unknown) => {
    throw error;
   });
 }

 /**
  * Specify which entity this subscriber listens to
  * @returns {any} The ConfigData entity class
  */
 // eslint-disable-next-line @elsikora/typescript/no-explicit-any
 listenTo(): any {
  return this.entityClass;
 }
}
