/* eslint-disable @elsikora/typescript/naming-convention */
import type { ICrudConfigProperties } from "@shared/interface/config";

import { ApiPropertyDescribe, EApiPropertyDateIdentifier, EApiPropertyDateType, EApiPropertyDescribeType, EApiPropertyStringType } from "@elsikora/nestjs-crud-automator";
import { ConfigSection } from "@modules/config/section/entity/section.entity";
import { Inject, Optional } from "@nestjs/common";
import { CRUD_CONFIG_PROPERTIES } from "@shared/constant/config";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, TableOptions, Unique, UpdateDateColumn } from "typeorm";

/**
 * Default values for ConfigData entity
 */
const DEFAULT_CONFIG_DATA: {
	MAX_DESCRIPTION_LENGTH: number;
	MAX_ENVIRONMENT_LENGTH: number;
	MAX_NAME_LENGTH: number;
	MAX_VALUE_LENGTH: number;
	TABLE_NAME: string;
} = {
	MAX_DESCRIPTION_LENGTH: 512,
	MAX_ENVIRONMENT_LENGTH: 64,
	MAX_NAME_LENGTH: 128,
	MAX_VALUE_LENGTH: 8192,
	TABLE_NAME: "config_data",
};

/**
 * Entity representing a configuration data value in the database
 */
@Entity({ name: DEFAULT_CONFIG_DATA.TABLE_NAME } as TableOptions)
@Unique(["name", "environment"])
export class ConfigData {
	private static maxDescriptionLength = DEFAULT_CONFIG_DATA.MAX_DESCRIPTION_LENGTH;

	private static maxEnvironmentLength = DEFAULT_CONFIG_DATA.MAX_ENVIRONMENT_LENGTH;

	private static maxNameLength = DEFAULT_CONFIG_DATA.MAX_NAME_LENGTH;

	// Store custom configuration
	private static maxValueLength = DEFAULT_CONFIG_DATA.MAX_VALUE_LENGTH;

	// Note: This property is updated in updateEntityOptions but won't affect the actual
	// table name at runtime due to how TypeORM processes entity decorators.
	// See updateEntityOptions method for details.
	// @ts-ignore
	private static tableName = DEFAULT_CONFIG_DATA.TABLE_NAME;

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
	 * Optional description of the configuration data (purpose, usage, etc.)
	 */
	@ApiPropertyDescribe({
		description: "description",
		exampleValue: "API key for third-party service",
		format: EApiPropertyStringType.STRING,
		isNullable: true,
		maxLength: ConfigData.maxDescriptionLength,
		minLength: 0,
		pattern: `/.{0,${ConfigData.maxDescriptionLength}}/`,
		type: EApiPropertyDescribeType.STRING,
	})
	@Column({ length: ConfigData.maxDescriptionLength, nullable: true, type: "varchar" })
	description?: string;

	/**
	 * The environment this configuration applies to
	 */
	@ApiPropertyDescribe({
		description: "environment",
		exampleValue: "production",
		format: EApiPropertyStringType.STRING,
		maxLength: ConfigData.maxEnvironmentLength,
		minLength: 1,
		pattern: `/.{1,${ConfigData.maxEnvironmentLength}}/`,
		type: EApiPropertyDescribeType.STRING,
	})
	@Column({ length: ConfigData.maxEnvironmentLength, nullable: false, type: "varchar" })
	environment!: string;

	/**
	 * Unique identifier of the configuration data
	 */
	@ApiPropertyDescribe({
		type: EApiPropertyDescribeType.UUID,
	})
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	/**
	 * Flag indicating whether the value is encrypted
	 */
	@ApiPropertyDescribe({
		description: "isEncrypted",
		type: EApiPropertyDescribeType.BOOLEAN,
	})
	@Column({ default: false, nullable: false, type: "boolean" })
	isEncrypted!: boolean;

	/**
	 * The name of the configuration data
	 */
	@ApiPropertyDescribe({
		description: "name",
		exampleValue: "API_KEY",
		format: EApiPropertyStringType.STRING,
		maxLength: ConfigData.maxNameLength,
		minLength: 1,
		pattern: `/^[A-Za-z0-9_-]{1,${ConfigData.maxNameLength}}/`,
		type: EApiPropertyDescribeType.STRING,
	})
	@Column({ length: ConfigData.maxNameLength, nullable: false, type: "varchar" })
	name!: string;

	/**
	 * The section this configuration data belongs to
	 */
	@ApiPropertyDescribe({
		description: "section",
		type: EApiPropertyDescribeType.RELATION,
	})
	@JoinColumn()
	@ManyToOne(() => ConfigSection, { eager: false, nullable: false, onDelete: "CASCADE" })
	section!: ConfigSection;

	/**
	 * The section ID this configuration data belongs to
	 */
	@ApiPropertyDescribe({
		description: "sectionId",
		type: EApiPropertyDescribeType.UUID,
	})
	@Column({ nullable: false, type: "uuid" })
	sectionId!: string;

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

	/**
	 * The value of the configuration data
	 */
	@ApiPropertyDescribe({
		description: "value",
		exampleValue: "configuration-value",
		format: EApiPropertyStringType.STRING,
		maxLength: ConfigData.maxValueLength,
		minLength: 0,
		pattern: `/.{0,${ConfigData.maxValueLength}}/`,
		type: EApiPropertyDescribeType.STRING,
	})
	@Column({ length: ConfigData.maxValueLength, nullable: false, type: "varchar" })
	value!: string;

	constructor(@Inject(CRUD_CONFIG_PROPERTIES) @Optional() options?: ICrudConfigProperties) {
		if (options?.entityOptions) {
			ConfigData.updateEntityOptions(options);
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

		if (entityOptions.configData) {
			const { configData } = entityOptions;

			if (configData.maxValueLength) {
				ConfigData.maxValueLength = configData.maxValueLength;
			}

			if (configData.maxNameLength) {
				ConfigData.maxNameLength = configData.maxNameLength;
			}

			if (configData.maxEnvironmentLength) {
				ConfigData.maxEnvironmentLength = configData.maxEnvironmentLength;
			}

			if (configData.maxDescriptionLength) {
				ConfigData.maxDescriptionLength = configData.maxDescriptionLength;
			}

			// Note: This updates the static property but won't affect the table name at runtime
			// since TypeORM reads the @Entity decorator only during class definition.
			// To fully support dynamic table names, a different approach would be required,
			// such as using EntitySchema or updating DataSource metadata directly.
			if (configData.tableName) {
				ConfigData.tableName = prefix + configData.tableName;
			} else if (prefix) {
				ConfigData.tableName = prefix + DEFAULT_CONFIG_DATA.TABLE_NAME;
			}
		} else if (prefix) {
			ConfigData.tableName = prefix + DEFAULT_CONFIG_DATA.TABLE_NAME;
		}
	}
}
