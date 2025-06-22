import type { ConfigData } from "@modules/config/data/entity/data.entity";
import type { EntityManager } from "typeorm/entity-manager/EntityManager";

/**
 * Event class for ConfigData beforeInsert event
 */
export default class ConfigDataEventBeforeInsert {
	/**
	 * Any additional context data for event handlers
	 */
	context?: Record<string, unknown>;

	/**
	 * EntityManager instance from the event
	 */
	eventManager!: EntityManager;

	/**
	 * The ConfigData entity instance
	 */
	item!: ConfigData;
}
