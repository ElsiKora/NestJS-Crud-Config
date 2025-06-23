// Note: This listener is designed to work with dynamic entities
// The actual entity type will be determined at runtime
import { ConflictException, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Repository } from "typeorm";

import ConfigDataEventBeforeInsert from "../event/beforeInsert.event";

/**
 * Event listener for ConfigData beforeInsert events
 */
@Injectable()
export default class ConfigDataBeforeInsertListener {
	constructor() {}

	/**
	 * Handle configdataevents.beforeInsert event
	 * @param payload Event payload
	 * @returns Object indicating success or failure
	 */
	@OnEvent("configdataevents.beforeInsert")
	async handleBeforeInsert(payload: ConfigDataEventBeforeInsert): Promise<{ error?: unknown; isSuccess: boolean }> {
		try {
			// Access the entity from the payload
			const entity = payload.item;
			const entityManager = payload.eventManager;

			// Check if a config with the same environment and name already exists
			// Note: Using dynamic entity type that will be resolved at runtime
			const configDataRepository: Repository<any> = entityManager.getRepository(entity.constructor);

			const existingConfigData = await configDataRepository.findOne({
				where: {
					environment: entity.environment,
					name: entity.name,
				},
			});

			// If a config with the same environment and name exists, throw a ConflictException
			if (existingConfigData) {
				throw new ConflictException("Config data with this environment and name already exists");
			}

			// Return success if no duplicate found
			return { isSuccess: true };
		} catch (error) {
			// Return failure with error
			return { error, isSuccess: false };
		}
	}
}
