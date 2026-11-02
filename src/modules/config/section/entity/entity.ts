/* eslint-disable @elsikora/typescript/naming-convention */
import type { TDynamicEntity } from "@shared/type";
import type { ColumnType } from "typeorm";

import type { IConfigSection } from "../interface";

import {
 ApiPropertyDescribe,
 EApiPropertyDateIdentifier,
 EApiPropertyDateType,
 EApiPropertyDescribeType,
 EApiPropertyStringType,
} from "@elsikora/nestjs-crud-automator";
import { API_PROPERTY_CONSTANT, CONFIG_ENTITY_CONSTANT } from "@shared/constant";
import { createDynamicEntityClass } from "@shared/utility";
import { CreateDateColumn, UpdateDateColumn } from "typeorm";

/**
 * Creates a dynamic ConfigSection entity with TypeORM decorators
 * @param {object} options - Configuration options for the entity
 * @param {number} options.maxDescriptionLength - Maximum length for description field
 * @param {number} options.maxNameLength - Maximum length for name field
 * @param {string} options.tableName - Name of the database table
 * @param {ColumnType} [options.timestampColumnType] - TypeORM type for timestamp fields; defaults to `Date`, the timestamp type of the driver
 * @returns {TDynamicEntity} Dynamically created ConfigSection entity class
 */
export function createConfigSectionEntity(options: {
 maxDescriptionLength: number;
 maxNameLength: number;
 tableName: string;
 timestampColumnType?: ColumnType;
}): TDynamicEntity<IConfigSection> {
 const timestampColumnType: ColumnType =
  options.timestampColumnType ?? CONFIG_ENTITY_CONSTANT.DEFAULT_TIMESTAMP_COLUMN_TYPE;

 return createDynamicEntityClass({
  columns: {
   createdAt: {
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
    // Without it TypeORM gives MySQL create and update date columns datetime(6), which no CURRENT_TIMESTAMP default fits
    precision: null,
    type: timestampColumnType,
   },
   description: {
    length: options.maxDescriptionLength,
    nullable: true,
    type: "varchar",
   },
   name: {
    length: options.maxNameLength,
    nullable: false,
    type: "varchar",
   },
   updatedAt: {
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
    onUpdate: "CURRENT_TIMESTAMP",
    precision: null,
    type: timestampColumnType,
   },
  },
  decorators: {
   createdAt: [
    CreateDateColumn({ type: timestampColumnType }),
    ApiPropertyDescribe({
     format: EApiPropertyDateType.DATE_TIME,
     identifier: EApiPropertyDateIdentifier.CREATED_AT,
     type: EApiPropertyDescribeType.DATE,
    }),
   ],
   description: [
    ApiPropertyDescribe({
     description: "name",
     exampleValue: "Section",
     format: EApiPropertyStringType.STRING,
     isNullable: true,
     maxLength: options.maxDescriptionLength,
     minLength: API_PROPERTY_CONSTANT.MIN_NAME_LENGTH,
     pattern: `/.{1,${options.maxDescriptionLength}}/`,
     type: EApiPropertyDescribeType.STRING,
    }),
   ],
   id: [
    ApiPropertyDescribe({
     type: EApiPropertyDescribeType.UUID,
    }),
   ],
   name: [
    ApiPropertyDescribe({
     description: "name",
     exampleValue: "section",
     format: EApiPropertyStringType.STRING,
     maxLength: options.maxNameLength,
     minLength: API_PROPERTY_CONSTANT.MIN_NAME_LENGTH,
     pattern: `/^[a-z0-9-]{1,${options.maxNameLength}}/`,
     type: EApiPropertyDescribeType.STRING,
    }),
   ],
   updatedAt: [
    UpdateDateColumn({ type: timestampColumnType }),
    ApiPropertyDescribe({
     format: EApiPropertyDateType.DATE_TIME,
     identifier: EApiPropertyDateIdentifier.UPDATED_AT,
     type: EApiPropertyDescribeType.DATE,
    }),
   ],
  },
  name: "ConfigSection",
  tableName: options.tableName,
 });
}
