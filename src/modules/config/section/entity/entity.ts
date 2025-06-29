/* eslint-disable @elsikora/typescript/naming-convention */
import type { TDynamicEntity } from "@shared/type";

import { ApiPropertyDescribe, EApiPropertyDateIdentifier, EApiPropertyDateType, EApiPropertyDescribeType, EApiPropertyStringType } from "@elsikora/nestjs-crud-automator";
import { API_PROPERTY_CONSTRAINTS } from "@shared/constant";
import { createDynamicEntityClass } from "@shared/utility";
import { CreateDateColumn, UpdateDateColumn } from "typeorm";

/**
 *
 * @param options
 * @param options.maxDescriptionLength
 * @param options.maxNameLength
 * @param options.tableName
 */
export function createConfigSectionEntity(options: { maxDescriptionLength: number; maxNameLength: number; tableName: string }): TDynamicEntity {
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
					description: "name",
					exampleValue: "Section",
					format: EApiPropertyStringType.STRING,
					isNullable: true,
					maxLength: options.maxDescriptionLength,
					minLength: API_PROPERTY_CONSTRAINTS.MIN_NAME_LENGTH,
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
					minLength: API_PROPERTY_CONSTRAINTS.MIN_NAME_LENGTH,
					pattern: `/^[a-z0-9-]{1,${options.maxNameLength}}/`,
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
		name: "ConfigSection",
		tableName: options.tableName,
	});
}
