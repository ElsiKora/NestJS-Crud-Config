/**
 * Working solution for using CrudConfigDynamicModule
 * This shows how to use dynamic entities with TypeORM
 */

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { 
    CrudConfigDynamicModule, 
    CONFIG_SECTION_ENTITY, 
    CONFIG_DATA_ENTITY,
    CrudConfigService 
} from "@elsikora/nestjs-crud-config";

/**
 * Basic example with dynamic entities
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        
        // Register CrudConfigDynamicModule with custom configuration
        CrudConfigDynamicModule.register({
            cacheOptions: {
                isEnabled: true,
            },
            application: "my-app",
            entityOptions: {
                configData: {
                    maxValueLength: 16_384,
                    tableName: "configuration_data",
                },
                configSection: {
                    maxNameLength: 256,
                    tableName: "configuration_sections",
                },
                tablePrefix: "app_",
            },
            environment: "development",
            isVerbose: true,
        }),
        
        // Configure TypeORM with dynamic entities
        TypeOrmModule.forRootAsync({
            imports: [CrudConfigDynamicModule],
            inject: [CONFIG_SECTION_ENTITY, CONFIG_DATA_ENTITY],
            useFactory: async (configSectionEntity: any, configDataEntity: any) => {
                return {
                    type: 'postgres',
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT || '5432'),
                    username: process.env.DB_USER || 'postgres',
                    password: process.env.DB_PASS || 'postgres',
                    database: process.env.DB_NAME || 'test_db',
                    entities: [
                        // Your application entities go here
                        // User,
                        // Product,
                        // Order,
                        
                        // Dynamic config entities
                        configSectionEntity,
                        configDataEntity,
                    ],
                    synchronize: process.env.NODE_ENV !== 'production',
                };
            },
        }),
    ],
})
export class AppModule {}

/**
 * Example with SQLite for testing/development
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        
        // Simple SQLite setup for development
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: ':memory:',
            synchronize: true,
            logging: true,
        }),
        
        // Register CrudConfigDynamicModule
        CrudConfigDynamicModule.register({
            application: "test-app",
            environment: "test",
            entityOptions: {
                // Custom table names will be created
                configData: {
                    tableName: "test_config_data",
                },
                configSection: {
                    tableName: "test_config_sections",
                },
            },
        }),
    ],
})
export class TestAppModule {}

/**
 * Example service using CrudConfigService
 */
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ConfigExampleService implements OnModuleInit {
    constructor(
        private readonly crudConfigService: CrudConfigService,
    ) {}

    async onModuleInit() {
        // Create a section
        const section = await this.crudConfigService.createSection({
            name: 'api-settings',
            description: 'API configuration settings',
        });

        // Set configuration values
        await this.crudConfigService.set({
            name: "API_KEY",
            section: "api-settings",
        }, "my-secret-api-key");

        await this.crudConfigService.set({
            name: "API_URL",
            section: "api-settings",
        }, "https://api.example.com");

        // Get configuration values
        const apiKey = await this.crudConfigService.get({ 
            name: "API_KEY", 
            section: "api-settings" 
        });
        
        console.log("API Key from dynamic table:", apiKey);

        // List all configs in a section
        const configs = await this.crudConfigService.findAll({
            section: "api-settings",
        });
        
        console.log("All configs in api-settings:", configs);
    }
}

/**
 * Advanced example with multiple environments
 */
@Injectable()
export class MultiEnvironmentConfigService {
    constructor(
        private readonly crudConfigService: CrudConfigService,
    ) {}

    async setupConfigs() {
        // Create configs for different environments
        const environments = ['development', 'staging', 'production'];
        
        for (const env of environments) {
            await this.crudConfigService.set({
                name: "DATABASE_URL",
                section: "database",
                environment: env,
            }, `postgres://localhost:5432/${env}_db`);

            await this.crudConfigService.set({
                name: "LOG_LEVEL",
                section: "logging",
                environment: env,
            }, env === 'production' ? 'error' : 'debug');
        }

        // Get config for specific environment
        const prodDbUrl = await this.crudConfigService.get({
            name: "DATABASE_URL",
            section: "database",
            environment: "production",
        });

        console.log("Production DB URL:", prodDbUrl);
    }
}

/**
 * Example with dependency injection of entity classes
 */
import { Inject } from '@nestjs/common';

@Injectable()
export class CustomEntityService {
    constructor(
        @Inject(CONFIG_SECTION_ENTITY) private readonly ConfigSection: any,
        @Inject(CONFIG_DATA_ENTITY) private readonly ConfigData: any,
    ) {
        // You can access the dynamic entity classes if needed
        console.log('Dynamic entity names:', {
            section: this.ConfigSection.name,
            sectionTable: this.ConfigSection.getRepository().metadata.tableName,
            data: this.ConfigData.name,
            dataTable: this.ConfigData.getRepository().metadata.tableName,
        });
    }
}