import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique, Index, TableOptions } from 'typeorm';
import { ApiPropertyDescribe, EApiPropertyDateIdentifier, EApiPropertyDateType, EApiPropertyDescribeType, EApiPropertyStringType } from "@elsikora/nestjs-crud-automator";

export interface DynamicColumnOptions {
  type?: any;
  length?: number;
  nullable?: boolean;
  default?: any;
  unique?: boolean;
  [key: string]: any;
}

export interface DynamicEntityOptions {
  name: string;
  tableName: string;
  columns: Record<string, DynamicColumnOptions>;
  relations?: Record<string, any>;
  decorators?: Record<string, Array<PropertyDecorator>>;
  classDecorators?: Array<ClassDecorator>;
  indexes?: Array<{ name: string; columns: string[] }>;
  uniques?: Array<string[]>;
}

export interface EntityClassType<T = any> {
  new (...args: any[]): T;
}

export type PropertyDecorator = (target: Object, propertyKey: string | symbol) => void;
export type ClassDecorator = <TFunction extends Function>(target: TFunction) => TFunction | void;

/**
 * Creates a dynamic entity class with TypeORM decorators
 * This approach allows full customization of table names and properties at runtime
 */
export function createDynamicEntityClass<T = any>(options: DynamicEntityOptions): EntityClassType<T> {
  const { name, tableName, columns, relations = {}, decorators = {}, classDecorators = [], indexes = [], uniques = [] } = options;

  // Create the dynamic class
  const DynamicEntity = class {} as any;
  
  // Set the class name
  Object.defineProperty(DynamicEntity, 'name', { value: name });

  // Apply Entity decorator with custom table name
  const entityOptions: TableOptions = { name: tableName };
  Entity(entityOptions)(DynamicEntity);

  // Apply additional class decorators
  classDecorators.forEach(decorator => decorator(DynamicEntity));

  // Apply unique constraints
  uniques.forEach(uniqueColumns => {
    Unique(uniqueColumns)(DynamicEntity);
  });

  // Apply indexes
  indexes.forEach(index => {
    Index(index.name, index.columns)(DynamicEntity);
  });

  // Add primary key if not specified
  if (!columns['id']) {
    PrimaryGeneratedColumn('uuid')(DynamicEntity.prototype, 'id');
    
    // Apply custom decorators for id if provided
    if (decorators['id']) {
      decorators['id'].forEach(decorator => decorator(DynamicEntity.prototype, 'id'));
    }
  }

  // Add columns
  Object.entries(columns).forEach(([propertyKey, columnOptions]) => {
    Column(columnOptions)(DynamicEntity.prototype, propertyKey);
    
    // Apply custom decorators if provided
    if (decorators[propertyKey]) {
      decorators[propertyKey].forEach(decorator => decorator(DynamicEntity.prototype, propertyKey));
    }
  });

  // Add relations
  Object.entries(relations).forEach(([propertyKey, relationOptions]) => {
    const { type, decorator, ...options } = relationOptions;
    
    switch (type) {
      case 'ManyToOne':
        ManyToOne(() => decorator.target, options)(DynamicEntity.prototype, propertyKey);
        if (options.joinColumn !== false) {
          JoinColumn()(DynamicEntity.prototype, propertyKey);
        }
        break;
      // Add other relation types as needed
    }
    
    // Apply custom decorators if provided
    if (decorators[propertyKey]) {
      decorators[propertyKey].forEach(decorator => decorator(DynamicEntity.prototype, propertyKey));
    }
  });

  return DynamicEntity as EntityClassType<T>;
}

/**
 * Creates ConfigSection entity with dynamic configuration
 */
export function createConfigSectionEntity(options: {
  tableName: string;
  maxNameLength: number;
  maxDescriptionLength: number;
}): EntityClassType {
  return createDynamicEntityClass({
    name: 'ConfigSection',
    tableName: options.tableName,
    columns: {
      name: {
        type: 'varchar',
        length: options.maxNameLength,
        nullable: false,
      },
      description: {
        type: 'varchar',
        length: options.maxDescriptionLength,
        nullable: true,
      },
      createdAt: {
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
      },
      updatedAt: {
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
      },
    },
    decorators: {
      id: [
        ApiPropertyDescribe({
          type: EApiPropertyDescribeType.UUID,
        }) as any,
      ],
      name: [
        ApiPropertyDescribe({
          description: "name",
          exampleValue: "section",
          format: EApiPropertyStringType.STRING,
          maxLength: options.maxNameLength,
          minLength: 1,
          pattern: `/^[a-z0-9-]{1,${options.maxNameLength}}/`,
          type: EApiPropertyDescribeType.STRING,
        }) as any,
      ],
      description: [
        ApiPropertyDescribe({
          description: "name",
          exampleValue: "Section",
          format: EApiPropertyStringType.STRING,
          isNullable: true,
          maxLength: options.maxDescriptionLength,
          minLength: 1,
          pattern: `/.{1,${options.maxDescriptionLength}}/`,
          type: EApiPropertyDescribeType.STRING,
        }) as any,
      ],
      createdAt: [
        CreateDateColumn() as any,
        ApiPropertyDescribe({
          format: EApiPropertyDateType.DATE_TIME,
          identifier: EApiPropertyDateIdentifier.CREATED_AT,
          type: EApiPropertyDescribeType.DATE,
        }) as any,
      ],
      updatedAt: [
        UpdateDateColumn() as any,
        ApiPropertyDescribe({
          format: EApiPropertyDateType.DATE_TIME,
          identifier: EApiPropertyDateIdentifier.UPDATED_AT,
          type: EApiPropertyDescribeType.DATE,
        }) as any,
      ],
    },
  });
}

/**
 * Creates ConfigData entity with dynamic configuration
 */
export function createConfigDataEntity(options: {
  tableName: string;
  maxNameLength: number;
  maxValueLength: number;
  maxEnvironmentLength: number;
  maxDescriptionLength: number;
  configSectionEntity: EntityClassType;
}): EntityClassType {
  return createDynamicEntityClass({
    name: 'ConfigData',
    tableName: options.tableName,
    columns: {
      name: {
        type: 'varchar',
        length: options.maxNameLength,
        nullable: false,
      },
      value: {
        type: 'varchar',
        length: options.maxValueLength,
        nullable: false,
      },
      description: {
        type: 'varchar',
        length: options.maxDescriptionLength,
        nullable: true,
      },
      environment: {
        type: 'varchar',
        length: options.maxEnvironmentLength,
        nullable: false,
      },
      isEncrypted: {
        type: 'boolean',
        default: false,
        nullable: false,
      },
      createdAt: {
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
      },
      updatedAt: {
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        nullable: false,
      },
    },
    relations: {
      section: {
        type: 'ManyToOne',
        decorator: { target: options.configSectionEntity },
        eager: false,
        nullable: false,
        onDelete: 'CASCADE',
      },
    },
    decorators: {
      id: [
        ApiPropertyDescribe({
          type: EApiPropertyDescribeType.UUID,
        }) as any,
      ],
      name: [
        ApiPropertyDescribe({
          description: "name",
          exampleValue: "API_KEY",
          format: EApiPropertyStringType.STRING,
          maxLength: options.maxNameLength,
          minLength: 1,
          pattern: `/^[A-Za-z0-9_-]{1,${options.maxNameLength}}/`,
          type: EApiPropertyDescribeType.STRING,
        }) as any,
      ],
      value: [
        ApiPropertyDescribe({
          description: "value",
          exampleValue: "configuration-value",
          format: EApiPropertyStringType.STRING,
          maxLength: options.maxValueLength,
          minLength: 0,
          pattern: `/.{0,${options.maxValueLength}}/`,
          type: EApiPropertyDescribeType.STRING,
        }) as any,
      ],
      description: [
        ApiPropertyDescribe({
          description: "description",
          exampleValue: "API key for third-party service",
          format: EApiPropertyStringType.STRING,
          isNullable: true,
          maxLength: options.maxDescriptionLength,
          minLength: 0,
          pattern: `/.{0,${options.maxDescriptionLength}}/`,
          type: EApiPropertyDescribeType.STRING,
        }) as any,
      ],
      environment: [
        ApiPropertyDescribe({
          description: "environment",
          exampleValue: "production",
          format: EApiPropertyStringType.STRING,
          maxLength: options.maxEnvironmentLength,
          minLength: 1,
          pattern: `/.{1,${options.maxEnvironmentLength}}/`,
          type: EApiPropertyDescribeType.STRING,
        }) as any,
      ],
      isEncrypted: [
        ApiPropertyDescribe({
          description: "isEncrypted",
          type: EApiPropertyDescribeType.BOOLEAN,
        }) as any,
      ],
      section: [
        ApiPropertyDescribe({
          description: "section",
          type: EApiPropertyDescribeType.RELATION,
        }) as any,
      ],
      createdAt: [
        CreateDateColumn() as any,
        ApiPropertyDescribe({
          format: EApiPropertyDateType.DATE_TIME,
          identifier: EApiPropertyDateIdentifier.CREATED_AT,
          type: EApiPropertyDescribeType.DATE,
        }) as any,
      ],
      updatedAt: [
        UpdateDateColumn() as any,
        ApiPropertyDescribe({
          format: EApiPropertyDateType.DATE_TIME,
          identifier: EApiPropertyDateIdentifier.UPDATED_AT,
          type: EApiPropertyDescribeType.DATE,
        }) as any,
      ],
    },
    uniques: [['name', 'environment']],
  });
}