/**
 * Example of using CrudConfigDynamicModule with custom table names and properties
 * This demonstrates how to fully customize entity configuration at runtime
 * 
 * The package now ONLY supports dynamic entities - static entities have been removed
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudConfigDynamicModule } from '@elsikora/nestjs-crud-config';

// Note: This package now ONLY supports dynamic entities
// Static entities (ConfigSection, ConfigData) have been removed

@Module({
  imports: [
    // Setup your database connection
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: true,
    }),
    
    // CrudConfigDynamicModule creates entities dynamically at runtime
    CrudConfigDynamicModule.register({
      application: 'my-app',
      environment: 'production',
      isVerbose: true,
      entityOptions: {
        // Add prefix to all tables
        tablePrefix: 'prod_',
        
        // Customize ConfigSection entity
        configSection: {
          tableName: 'configuration_sections', // Will become 'prod_configuration_sections'
          maxNameLength: 256,
          maxDescriptionLength: 1024,
        },
        
        // Customize ConfigData entity
        configData: {
          tableName: 'configuration_values', // Will become 'prod_configuration_values'
          maxNameLength: 256,
          maxValueLength: 16384, // Support larger values
          maxEnvironmentLength: 128,
          maxDescriptionLength: 1024,
        },
      },
    }),
  ],
})
export class AppModule {}

/**
 * Example with async registration
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: +process.env.DB_PORT,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        synchronize: process.env.NODE_ENV !== 'production',
      }),
    }),
    
    CrudConfigDynamicModule.registerAsync({
      useFactory: () => ({
        application: process.env.APP_NAME || 'default-app',
        environment: process.env.NODE_ENV || 'development',
        entityOptions: {
          tablePrefix: process.env.TABLE_PREFIX || '',
          configSection: {
            tableName: process.env.CONFIG_SECTION_TABLE || 'config_section',
            maxNameLength: 256,
          },
          configData: {
            tableName: process.env.CONFIG_DATA_TABLE || 'config_data',
            maxValueLength: process.env.MAX_CONFIG_VALUE_LENGTH 
              ? parseInt(process.env.MAX_CONFIG_VALUE_LENGTH) 
              : 8192,
          },
        },
      }),
    }),
  ],
})
export class AsyncAppModule {}

/**
 * Example with custom decorators
 */
import { createDynamicEntityClass, DynamicEntityOptions } from '@elsikora/nestjs-crud-config';

// Custom decorator for audit fields
function AuditField(): PropertyDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata('isAuditField', true, target, propertyKey);
  };
}

// Custom decorator for encrypted fields
function Encrypted(): PropertyDecorator {
  return (target, propertyKey) => {
    Reflect.defineMetadata('isEncrypted', true, target, propertyKey);
  };
}

// Create a custom entity with additional decorators
const customEntityOptions: DynamicEntityOptions = {
  name: 'CustomConfig',
  tableName: 'custom_config',
  columns: {
    key: {
      type: 'varchar',
      length: 255,
      nullable: false,
      unique: true,
    },
    value: {
      type: 'text',
      nullable: false,
    },
    createdBy: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
    updatedBy: {
      type: 'varchar',
      length: 100,
      nullable: true,
    },
  },
  decorators: {
    value: [Encrypted()],
    createdBy: [AuditField()],
    updatedBy: [AuditField()],
  },
  indexes: [
    { name: 'idx_custom_config_key', columns: ['key'] },
  ],
};

const CustomConfigEntity = createDynamicEntityClass(customEntityOptions);

/**
 * Usage in service
 */
import { Injectable } from '@nestjs/common';
import { CrudConfigService } from '@elsikora/nestjs-crud-config';

@Injectable()
export class MyService {
  constructor(private readonly configService: CrudConfigService) {}

  async example() {
    // The service works the same way regardless of the underlying table structure
    await this.configService.set({
      application: 'my-app',
      environment: 'production',
      path: ['api', 'key'],
    }, 'secret-key-value');

    const value = await this.configService.get({
      application: 'my-app',
      environment: 'production',
      path: ['api', 'key'],
    });

    console.log('Retrieved value:', value);
  }
}