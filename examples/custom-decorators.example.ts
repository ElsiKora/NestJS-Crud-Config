/**
 * Example showing how to use custom decorators with dynamic entities
 * This demonstrates how ApiPropertyDescribe and other decorators work with dynamic entities
 */

import { Module, Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { 
  CrudConfigDynamicModule, 
  createDynamicEntityClass, 
  DynamicEntityOptions,
  PropertyDecorator,
} from '@elsikora/nestjs-crud-config';
import { ApiPropertyDescribe, EApiPropertyDescribeType, EApiPropertyStringType } from '@elsikora/nestjs-crud-automator';

/**
 * Custom decorator for marking sensitive fields
 */
function Sensitive(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    Reflect.defineMetadata('isSensitive', true, target, propertyKey);
    console.log(`Field ${String(propertyKey)} marked as sensitive`);
  };
}

/**
 * Custom decorator for validation rules
 */
function ValidationRule(rule: string): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    Reflect.defineMetadata('validationRule', rule, target, propertyKey);
  };
}

/**
 * Create a fully custom configuration entity with all decorators
 */
function createCustomConfigEntity() {
  const options: DynamicEntityOptions = {
    name: 'CustomConfiguration',
    tableName: 'custom_configuration',
    columns: {
      configKey: {
        type: 'varchar',
        length: 255,
        nullable: false,
        unique: true,
      },
      configValue: {
        type: 'text',
        nullable: false,
      },
      category: {
        type: 'varchar',
        length: 100,
        nullable: false,
      },
      isSensitive: {
        type: 'boolean',
        default: false,
      },
      validationRule: {
        type: 'varchar',
        length: 500,
        nullable: true,
      },
    },
    decorators: {
      id: [
        ApiPropertyDescribe({
          type: EApiPropertyDescribeType.UUID,
        }) as any,
      ],
      configKey: [
        ApiPropertyDescribe({
          description: "Configuration key",
          exampleValue: "API_ENDPOINT",
          format: EApiPropertyStringType.STRING,
          maxLength: 255,
          minLength: 1,
          type: EApiPropertyDescribeType.STRING,
        }) as any,
        ValidationRule('required|alphanumeric|uppercase'),
      ],
      configValue: [
        ApiPropertyDescribe({
          description: "Configuration value",
          exampleValue: "https://api.example.com",
          format: EApiPropertyStringType.STRING,
          type: EApiPropertyDescribeType.STRING,
        }) as any,
        Sensitive(), // Mark as sensitive
      ],
      category: [
        ApiPropertyDescribe({
          description: "Configuration category",
          exampleValue: "API",
          format: EApiPropertyStringType.STRING,
          maxLength: 100,
          type: EApiPropertyDescribeType.STRING,
        }) as any,
      ],
      isSensitive: [
        ApiPropertyDescribe({
          description: "Whether this configuration contains sensitive data",
          type: EApiPropertyDescribeType.BOOLEAN,
        }) as any,
      ],
      validationRule: [
        ApiPropertyDescribe({
          description: "Validation rules for this configuration",
          exampleValue: "url|https",
          format: EApiPropertyStringType.STRING,
          isNullable: true,
          maxLength: 500,
          type: EApiPropertyDescribeType.STRING,
        }) as any,
      ],
    },
    indexes: [
      { name: 'idx_config_category', columns: ['category'] },
      { name: 'idx_config_key', columns: ['configKey'] },
    ],
  };

  return createDynamicEntityClass(options);
}

/**
 * Service to demonstrate accessing decorator metadata
 */
@Injectable()
export class CustomConfigService {
  /**
   * Check if a field is marked as sensitive
   */
  isSensitiveField(entity: any, fieldName: string): boolean {
    return Reflect.getMetadata('isSensitive', entity, fieldName) === true;
  }

  /**
   * Get validation rule for a field
   */
  getValidationRule(entity: any, fieldName: string): string | undefined {
    return Reflect.getMetadata('validationRule', entity, fieldName);
  }

  /**
   * Example of using the metadata
   */
  processConfig(configEntity: any) {
    const instance = new configEntity();
    
    // Check if configValue is sensitive
    if (this.isSensitiveField(instance, 'configValue')) {
      console.log('Config value is sensitive, will encrypt before saving');
    }

    // Get validation rule for configKey
    const rule = this.getValidationRule(instance, 'configKey');
    if (rule) {
      console.log(`Validation rule for configKey: ${rule}`);
    }
  }
}

/**
 * Example module using CrudConfigDynamicModule with enhanced decorators
 */
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: ['query', 'error'],
    }),
    
    // Use the dynamic module with full decorator support
    CrudConfigDynamicModule.register({
      application: 'custom-app',
      environment: 'production',
      isVerbose: true,
      entityOptions: {
        tablePrefix: 'app_',
        configSection: {
          tableName: 'configuration_sections',
          maxNameLength: 256,
          maxDescriptionLength: 1024,
        },
        configData: {
          tableName: 'configuration_data',
          maxNameLength: 256,
          maxValueLength: 65536, // Support very large values
          maxEnvironmentLength: 128,
          maxDescriptionLength: 1024,
        },
      },
    }),
  ],
  providers: [CustomConfigService],
})
export class EnhancedConfigModule {}

/**
 * Usage example showing that ApiPropertyDescribe works with dynamic entities
 */
async function demonstrateApiPropertyDescribe() {
  // The dynamic entities created by CrudConfigDynamicModule have ApiPropertyDescribe decorators
  // This means they will work properly with:
  // 1. Swagger/OpenAPI documentation generation
  // 2. Validation frameworks that use these decorators
  // 3. Any other tools that rely on ApiPropertyDescribe metadata

  console.log('Dynamic entities include ApiPropertyDescribe decorators for:');
  console.log('- UUID fields with proper type definitions');
  console.log('- String fields with length constraints and patterns');
  console.log('- Date fields with proper formatting');
  console.log('- Boolean fields with type information');
  console.log('- Relation fields marked as relations');
}