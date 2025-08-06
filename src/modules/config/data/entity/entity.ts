/* eslint-disable @elsikora/typescript/naming-convention */
import type { TDynamicEntity } from "@shared/type";

import {
 ApiPropertyDescribe,
 EApiPropertyDateIdentifier,
 EApiPropertyDateType,
 EApiPropertyDescribeType,
 EApiPropertyStringType,
} from "@elsikora/nestjs-crud-automator";
import { API_PROPERTY_CONSTANT } from "@shared/constant";
import { createDynamicEntityClass } from "@shared/utility";
import { CreateDateColumn, UpdateDateColumn } from "typeorm";

/**
 * Creates a dynamic ConfigData entity with TypeORM decorators
 * @param {object} options - Configuration options for the entity
 * @param {TDynamicEntity} options.configSectionEntity - The ConfigSection entity to create relation with
 * @param {number} options.maxDescriptionLength - Maximum length for description field
 * @param {number} options.maxEnvironmentLength - Maximum length for environment field
 * @param {number} options.maxNameLength - Maximum length for name field
 * @param {number} options.maxValueLength - Maximum length for value field
 * @param {string} options.tableName - Name of the database table
 * @returns {TDynamicEntity} Dynamically created ConfigData entity class
 */
export function createConfigDataEntity(options: {
 configSectionEntity: TDynamicEntity;
 maxDescriptionLength: number;
 maxEnvironmentLength: number;
 maxNameLength: number;
 maxValueLength: number;
 tableName: string;
}): TDynamicEntity {
 return createDynamicEntityClass({
  columns: {
   createdAt: {
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
    type: "timestamp",
   },
   description: {
    length: options.maxDescriptionLength,
    nullable: true,
    type: "varchar",
   },
   environment: {
    length: options.maxEnvironmentLength,
    nullable: false,
    type: "varchar",
   },
   isEncrypted: {
    default: false,
    nullable: false,
    type: "boolean",
   },
   name: {
    length: options.maxNameLength,
    nullable: false,
    type: "varchar",
   },
   updatedAt: {
    default: () => "CURRENT_TIMESTAMP",
    nullable: false,
    type: "timestamp",
   },
   value: {
    length: options.maxValueLength,
    nullable: false,
    type: "varchar",
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
   description: [
    ApiPropertyDescribe({
     description: "description",
     exampleValue: "API key for third-party service",
     format: EApiPropertyStringType.STRING,
     isNullable: true,
     maxLength: options.maxDescriptionLength,
     minLength: API_PROPERTY_CONSTANT.MIN_STRING_LENGTH,
     pattern: `/.{0,${options.maxDescriptionLength}}/`,
     type: EApiPropertyDescribeType.STRING,
    }),
   ],
   environment: [
    ApiPropertyDescribe({
     description: "environment",
     exampleValue: "production",
     format: EApiPropertyStringType.STRING,
     maxLength: options.maxEnvironmentLength,
     minLength: API_PROPERTY_CONSTANT.MIN_NAME_LENGTH,
     pattern: `/.{1,${options.maxEnvironmentLength}}/`,
     type: EApiPropertyDescribeType.STRING,
    }),
   ],
   id: [
    ApiPropertyDescribe({
     type: EApiPropertyDescribeType.UUID,
    }),
   ],
   isEncrypted: [
    ApiPropertyDescribe({
     description: "isEncrypted",
     type: EApiPropertyDescribeType.BOOLEAN,
    }),
   ],
   name: [
    ApiPropertyDescribe({
     description: "name",
     exampleValue: "API_KEY",
     format: EApiPropertyStringType.STRING,
     maxLength: options.maxNameLength,
     minLength: API_PROPERTY_CONSTANT.MIN_NAME_LENGTH,
     pattern: `/^[A-Za-z0-9_-]{1,${options.maxNameLength}}/`,
     type: EApiPropertyDescribeType.STRING,
    }),
   ],
   section: [
    ApiPropertyDescribe({
     description: "section",
     type: EApiPropertyDescribeType.RELATION,
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
   value: [
    ApiPropertyDescribe({
     description: "value",
     exampleValue: "configuration-value",
     format: EApiPropertyStringType.STRING,
     maxLength: options.maxValueLength,
     minLength: API_PROPERTY_CONSTANT.MIN_STRING_LENGTH,
     pattern: `/.{0,${options.maxValueLength}}/`,
     type: EApiPropertyDescribeType.STRING,
    }),
   ],
  },
  name: "ConfigData",
  relations: {
   section: {
    decorator: { target: options.configSectionEntity },
    eager: false,
    nullable: false,
    onDelete: "CASCADE",
    type: "ManyToOne",
   },
  },
  tableName: options.tableName,
  uniques: [["name", "environment", "section"]],
 });
}
