import type { EntitySubscriberInterface, InsertEvent } from "typeorm";

import { EErrorStringAction } from "@elsikora/nestjs-crud-automator";
import { ErrorString } from "@elsikora/nestjs-crud-automator";
import { ConfigData } from "@modules/config/data/entity/data.entity";
import { HttpException, Inject, InternalServerErrorException } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DataSource, EventSubscriber } from "typeorm";

import ConfigDataEventBeforeInsert from "../event/beforeInsert.event";

/**
 * TypeORM subscriber for ConfigData beforeInsert event
 */
@EventSubscriber()
export default class ConfigDataBeforeInsertSubscriber implements EntitySubscriberInterface<ConfigData> {
	constructor(
		private readonly eventEmitter: EventEmitter2,
		@Inject(DataSource) readonly connection: DataSource,
	) {
		// Register this subscriber with the DataSource
		connection.subscribers.push(this);
	}

	/**
	 * Handle the beforeInsert event
	 * @param event The TypeORM event object
	 * @returns Promise resolving to boolean indicating success
	 */
	beforeInsert(event: InsertEvent<ConfigData>): Promise<boolean> {
		const configdata: ConfigData = event.entity;

		// Create event payload
		const payload: ConfigDataEventBeforeInsert = new ConfigDataEventBeforeInsert();
		payload.item = configdata;
		payload.eventManager = event.manager;

		// Emit event asynchronously and process results
		return this.eventEmitter
			.emitAsync("configdataevents.beforeInsert", payload)
			.then((result: Array<{ error?: unknown; isSuccess: boolean }>) => {
				// Check if all listeners succeeded
				if (result.every((item: { error?: unknown; isSuccess: boolean }) => item.isSuccess)) {
					return true;
				} else {
					// Find first error
					const error: unknown = result.find((item: { error?: unknown; isSuccess: boolean }) => !item.isSuccess)?.error;

					if (error instanceof HttpException) {
						throw error;
					}

					throw new InternalServerErrorException(
						ErrorString({
							entity: ConfigData,
							type: EErrorStringAction.CREATING_ERROR,
						}),
					);
				}
			})
			.catch((error: unknown) => {
				throw error;
			});
	}

	/**
	 * Specify which entity this subscriber listens to
	 */
	listenTo(): typeof ConfigData {
		return ConfigData;
	}
}
