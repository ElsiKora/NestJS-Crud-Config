import type { ColumnType } from "typeorm";

import type { IConfigEntityDataOptions, IConfigEntitySectionOptions } from "./";

/**
 * Interface for entity customization options
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/crud-config-entity-options | API Reference - ICrudConfigEntityOptions}
 */
export interface ICrudConfigEntityOptions {
 /**
  * ConfigData entity options
  */
 configData?: IConfigEntityDataOptions;

 /**
  * ConfigSection entity options
  */
 configSection?: IConfigEntitySectionOptions;

 /**
  * Table name prefix for all entities
  */
 tablePrefix?: string;

 /**
  * TypeORM column type used by all ConfigSection, ConfigData, and ConfigMigration timestamp fields.
  * Defaults to `timestamp`.
  */
 timestampColumnType?: ColumnType;
}
