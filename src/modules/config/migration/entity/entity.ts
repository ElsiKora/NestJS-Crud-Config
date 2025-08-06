/* eslint-disable @elsikora/typescript/naming-convention */
import type { TDynamicEntity } from "@shared/type";

import {
 ApiPropertyDescribe,
 EApiPropertyDateIdentifier,
 EApiPropertyDateType,
 EApiPropertyDescribeType,
 EApiPropertyStringType,
} from "@elsikora/nestjs-crud-automator";
import { API_PROPERTY_CONSTANT, CONFIG_MIGRATION_CONSTANT } from "@shared/constant";
import { createDynamicEntityClass } from "@shared/utility";
import { CreateDateColumn, UpdateDateColumn } from "typeorm";

/**
 * Creates a dynamic ConfigMigration entity with TypeORM decorators
 * @param {object} options - Configuration options for the entity
 * @param {number} options.maxNameLength - Maximum length for migration name field
 * @param {string} options.tableName - Name of the database table
 * @returns {TDynamicEntity} Dynamically created ConfigMigration entity class
 */
export function createConfigMigrationEntity(options: {
 maxNameLength: number;
 tableName: string;
}): TDynamicEntity {
 return createDynamicEntityClass({
  columns: {
   createdAt: {
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
    type: "timestamp",
   },
   executedAt: {
    nullable: true,
    type: "timestamp",
   },
   failedAt: {
    nullable: true,
    type: "timestamp",
   },
   name: {
    length: options.maxNameLength,
    nullable: false,
    type: "varchar",
   },
   startedAt: {
    nullable: true,
    type: "timestamp",
   },
   status: {
    default: "PENDING",
    enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED", "STUCK"],
    nullable: false,
    type: "enum",
   },
   updatedAt: {
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
    type: "timestamp",
   },
  },
  decorators: {
   createdAt: [
    CreateDateColumn(),
    ApiPropertyDescribe({
     format: EApiPropertyDateType.DATE_TIME,
     identifier: EApiPropertyDateIdentifier.CREATED_AT,
     type: EApiPropertyDescribeType.DATE,
    }),
   ],
   executedAt: [
    ApiPropertyDescribe({
     format: EApiPropertyDateType.DATE_TIME,
     identifier: EApiPropertyDateIdentifier.CREATED_AT,
     isNullable: true,
     type: EApiPropertyDescribeType.DATE,
    }),
   ],
   failedAt: [
    ApiPropertyDescribe({
     format: EApiPropertyDateType.DATE_TIME,
     identifier: EApiPropertyDateIdentifier.CREATED_AT,
     isNullable: true,
     type: EApiPropertyDescribeType.DATE,
    }),
   ],
   id: [
    ApiPropertyDescribe({
     type: EApiPropertyDescribeType.UUID,
    }),
   ],
   name: [
    ApiPropertyDescribe({
     description: "Migration name",
     exampleValue: "001_initial_config_setup",
     format: EApiPropertyStringType.STRING,
     maxLength: options.maxNameLength,
     minLength: API_PROPERTY_CONSTANT.MIN_NAME_LENGTH,
     pattern: `/^[A-Za-z0-9_-]{1,${options.maxNameLength}}/`,
     type: EApiPropertyDescribeType.STRING,
    }),
   ],
   startedAt: [
    ApiPropertyDescribe({
     format: EApiPropertyDateType.DATE_TIME,
     identifier: EApiPropertyDateIdentifier.CREATED_AT,
     isNullable: true,
     type: EApiPropertyDescribeType.DATE,
    }),
   ],
   status: [
    ApiPropertyDescribe({
     description: "Migration execution status",
     exampleValue: "COMPLETED",
     format: EApiPropertyStringType.STRING,
     maxLength: CONFIG_MIGRATION_CONSTANT.MAX_STATUS_LENGTH,
     minLength: API_PROPERTY_CONSTANT.MIN_NAME_LENGTH,
     pattern: `/^[A-Z_]{1,${CONFIG_MIGRATION_CONSTANT.MAX_STATUS_LENGTH}}/`,
     type: EApiPropertyDescribeType.STRING,
    }),
   ],
   updatedAt: [
    UpdateDateColumn(),
    ApiPropertyDescribe({
     format: EApiPropertyDateType.DATE_TIME,
     identifier: EApiPropertyDateIdentifier.UPDATED_AT,
     type: EApiPropertyDescribeType.DATE,
    }),
   ],
  },
  indexes: [
   { columns: ["status"], name: "idx_config_migration_status" },
   { columns: ["startedAt"], name: "idx_config_migration_started_at" },
   { columns: ["createdAt"], name: "idx_config_migration_created_at" },
  ],
  name: "ConfigMigration",
  tableName: options.tableName,
  uniques: [["name"]],
 });
}
