import type { ColumnType } from "typeorm";

// TypeORM maps Date to each driver's timestamp type: timestamp on PostgreSQL, datetime on MySQL, MariaDB and SQLite
const DEFAULT_TIMESTAMP_COLUMN_TYPE: ColumnType = Date;

export const CONFIG_ENTITY_CONSTANT: {
 readonly DEFAULT_TIMESTAMP_COLUMN_TYPE: ColumnType;
} = {
 DEFAULT_TIMESTAMP_COLUMN_TYPE,
} as const;
