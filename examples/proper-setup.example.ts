/**
 * Proper setup example for NestJS CRUD Config with dynamic entities
 * This example shows the correct way to integrate dynamic entities with TypeORM
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudConfigFullDynamicModule } from '@modules/config';

// Configuration for the CRUD module
const crudConfigOptions = {
  entityOptions: {
    tablePrefix: 'app_',
    configSection: {
      tableName: 'config_sections',
      maxNameLength: 255,
      maxDescriptionLength: 1000,
    },
    configData: {
      tableName: 'config_data',
      maxNameLength: 255,
      maxValueLength: 10000,
      maxEnvironmentLength: 50,
      maxDescriptionLength: 1000,
    },
  },
};

/**
 * Option 1: Using TypeOrmModule.forRootAsync (RECOMMENDED)
 * This ensures entities are created before TypeORM initializes
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'config_db',
        entities: [
          // Pass options to getEntities to ensure entities are initialized
          ...CrudConfigFullDynamicModule.getEntities(crudConfigOptions),
          // Add your other entities here
        ],
        synchronize: true,
        logging: true,
      }),
    }),
    // Register the module with the same options
    CrudConfigFullDynamicModule.register(crudConfigOptions),
  ],
})
export class AppModuleOption1 {}

/**
 * Option 2: Manual entity initialization
 * Call register first, then use getEntities
 */
// Initialize the module (this creates the entities)
const moduleConfig = CrudConfigFullDynamicModule.register(crudConfigOptions);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'config_db',
      entities: [
        // Now getEntities() can be called without options
        ...CrudConfigFullDynamicModule.getEntities(),
      ],
      synchronize: true,
    }),
    moduleConfig, // Use the pre-registered module
  ],
})
export class AppModuleOption2 {}

/**
 * Option 3: Using with existing TypeORM configuration
 * If you already have TypeORM configured with a connection
 */
@Module({
  imports: [
    // Your existing TypeORM module that includes dynamic entities
    TypeOrmModule.forRoot({
      // ... your config
      entities: [
        // Make sure to include the dynamic entities
        ...CrudConfigFullDynamicModule.getEntities(crudConfigOptions),
        // ... other entities
      ],
    }),
    // Register the CRUD module
    CrudConfigFullDynamicModule.register(crudConfigOptions),
  ],
})
export class AppModuleOption3 {}

/**
 * Testing example with SQLite
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite',
        database: ':memory:',
        entities: CrudConfigFullDynamicModule.getEntities(crudConfigOptions),
        synchronize: true,
      }),
    }),
    CrudConfigFullDynamicModule.register(crudConfigOptions),
  ],
})
export class TestAppModule {}

/**
 * Using the services in your application
 */
import { Injectable, Inject } from '@nestjs/common';
import { CrudConfigService } from '@modules/config';

@Injectable()
export class MyService {
  constructor(
    private readonly configService: CrudConfigService,
    @Inject('CONFIG_SECTION_ENTITY') private readonly SectionEntity: any,
    @Inject('CONFIG_DATA_ENTITY') private readonly DataEntity: any,
  ) {}

  async getConfig() {
    // Use the service
    const config = await this.configService.get({
      section: 'api',
      name: 'api_key',
      environment: 'production',
    });
    
    return config;
  }

  async checkEntityTypes() {
    // You can access the entity classes if needed
    console.log('Section entity name:', this.SectionEntity.name);
    console.log('Data entity name:', this.DataEntity.name);
  }
}