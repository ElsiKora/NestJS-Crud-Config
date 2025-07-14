import type { IConfigData } from "@modules/config/data";
// Note: This event handler is designed to work with dynamic entities
// The actual entity type will be determined at runtime
import type { EntityManager } from "typeorm/entity-manager/EntityManager";

/**
 * Event class for ConfigData beforeInsert event
 */
export class ConfigDataEventBeforeInsert {
 /**
  * Any additional context data for event handlers
  */
 context?: Record<string, unknown>;

 /**
  * EntityManager instance from the event
  */
 eventManager!: EntityManager;

 /**
  * The dynamic entity instance
  * Note: This will be a dynamically generated entity at runtime
  */
 item!: IConfigData;
}
