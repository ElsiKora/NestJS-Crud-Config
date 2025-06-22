import type { ICrudConfigProperties } from "@shared/interface/config";

import { ApiPropertyDescribe, EApiPropertyDateIdentifier, EApiPropertyDateType, EApiPropertyDescribeType, EApiPropertyStringType } from "@elsikora/nestjs-crud-automator";
import { Inject, Optional } from "@nestjs/common";
import { CRUD_CONFIG_PROPERTIES } from "@shared/constant/config";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, TableOptions, UpdateDateColumn } from "typeorm";

/**
 * Default values for ConfigSection entity
 */
const DEFAULT_CONFIG_SECTION = {
	MAX_DESCRIPTION_LENGTH: 512,
	MAX_NAME_LENGTH: 128,
	TABLE_NAME: "config_section",
};

/**
 * Entity representing a configuration section in the database
 */
@Entity({ name: DEFAULT_CONFIG_SECTION.TABLE_NAME } as TableOptions)
export class ConfigSection {
	private static maxDescriptionLength = DEFAULT_CONFIG_SECTION.MAX_DESCRIPTION_LENGTH;

	// Store custom configuration
	private static maxNameLength = DEFAULT_CONFIG_SECTION.MAX_NAME_LENGTH;

	// Note: This property is updated in updateEntityOptions but won't affect the actual
	// table name at runtime due to how TypeORM processes entity decorators.
	// See updateEntityOptions method for details.
	// @ts-ignore
	private static tableName = DEFAULT_CONFIG_SECTION.TABLE_NAME;

	/**
	 * When the entry was created
	 */
	@ApiPropertyDescribe({
		format: EApiPropertyDateType.DATE_TIME,
		identifier: EApiPropertyDateIdentifier.CREATED_AT,
		type: EApiPropertyDescribeType.DATE,
	})
	@CreateDateColumn({ default: () => "CURRENT_TIMESTAMP", nullable: false, type: "timestamp" })
	createdAt!: Date;

	/**
	 * Description of the configuration entry (optional)
	 */
	@ApiPropertyDescribe({
		description: "name",
		exampleValue: "Section",
		format: EApiPropertyStringType.STRING,
		isNullable: true,
		maxLength: ConfigSection.maxDescriptionLength,
		minLength: 1,
		pattern: `/.{1,${ConfigSection.maxDescriptionLength}}/`,
		type: EApiPropertyDescribeType.STRING,
	})
	@Column({ length: ConfigSection.maxDescriptionLength, nullable: true, type: "varchar" })
	description?: string;

	/**
	 * Unique identifier of the configuration entry
	 */
	@ApiPropertyDescribe({
		type: EApiPropertyDescribeType.UUID,
	})
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	/**
	 * The name of the configuration section
	 */
	@ApiPropertyDescribe({
		description: "name",
		exampleValue: "section",
		format: EApiPropertyStringType.STRING,
		maxLength: ConfigSection.maxNameLength,
		minLength: 1,
		pattern: `/^[a-z0-9-]{1,${ConfigSection.maxNameLength}}/`,
		type: EApiPropertyDescribeType.STRING,
	})
	@Column({ length: ConfigSection.maxNameLength, nullable: false, type: "varchar" })
	name!: string;

	/**
	 * When the entry was last updated
	 */
	@ApiPropertyDescribe({
		format: EApiPropertyDateType.DATE_TIME,
		identifier: EApiPropertyDateIdentifier.UPDATED_AT,
		type: EApiPropertyDescribeType.DATE,
	})
	@UpdateDateColumn({ default: () => "CURRENT_TIMESTAMP", nullable: false, type: "timestamp" })
	updatedAt!: Date;

	constructor(@Inject(CRUD_CONFIG_PROPERTIES) @Optional() options?: ICrudConfigProperties) {
		if (options?.entityOptions) {
			ConfigSection.updateEntityOptions(options);
		}
	}

	/**
	 * Static method to update entity configuration based on provided options
	 * @param options Configuration properties
	 */
	public static updateEntityOptions(options?: ICrudConfigProperties): void {
		if (!options?.entityOptions) {
			return;
		}

		const { entityOptions } = options;
		const prefix = entityOptions.tablePrefix || "";

		if (entityOptions.configSection) {
			const { configSection } = entityOptions;

			if (configSection.maxNameLength) {
				ConfigSection.maxNameLength = configSection.maxNameLength;
			}

			if (configSection.maxDescriptionLength) {
				ConfigSection.maxDescriptionLength = configSection.maxDescriptionLength;
			}

			// Note: This updates the static property but won't affect the table name at runtime
			// since TypeORM reads the @Entity decorator only during class definition.
			// To fully support dynamic table names, a different approach would be required,
			// such as using EntitySchema or updating DataSource metadata directly.
			if (configSection.tableName) {
				ConfigSection.tableName = prefix + configSection.tableName;
			} else if (prefix) {
				ConfigSection.tableName = prefix + DEFAULT_CONFIG_SECTION.TABLE_NAME;
			}
		} else if (prefix) {
			ConfigSection.tableName = prefix + DEFAULT_CONFIG_SECTION.TABLE_NAME;
		}
	}
}
