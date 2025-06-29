import { ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import { IConfigData } from "@modules/config/data";
import { ConfigDataEventBeforeInsert } from "@modules/config/data";
import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { TOKEN_CONSTANT } from "@shared/constant";
import { EntityManager } from "typeorm/entity-manager/EntityManager";

/**
 * Event listener for ConfigData beforeInsert events
 */
@Injectable()
export class ConfigDataBeforeInsertListener {
	constructor(@Inject(TOKEN_CONSTANT.CONFIG_DATA_SERVICE) private readonly service: ApiServiceBase<IConfigData>) {}

	/**
	 * Handle configdataevents.beforeInsert event
	 * @param {ConfigDataEventBeforeInsert} payload Event payload
	 * @returns {Promise<{ error?: unknown; isSuccess: boolean }>} Object indicating success or failure
	 */
	@OnEvent("config-data.beforeInsert")
	async handleBeforeInsert(payload: ConfigDataEventBeforeInsert): Promise<{ error?: unknown; isSuccess: boolean }> {
		try {
			// Access the entity from the payload
			const entity: IConfigData = payload.item;
			const entityManager: EntityManager = payload.eventManager;

			const existingConfigData: IConfigData | null = await this.service.get(
				{
					where: {
						environment: entity.environment,
						name: entity.name,
					},
				},
				entityManager,
			);

			if (existingConfigData) {
				throw new ConflictException("ConfigData with this environment and name already exists");
			}

			// Return success if no duplicate found
			return { isSuccess: true };
		} catch (error) {
			if (error instanceof NotFoundException) {
				return { isSuccess: true };
			}

			return { error, isSuccess: false };
		}
	}
}
