/**
 * Example with full ApiPropertyDescribe support
 * This uses CrudConfigFullDynamicModule which supports all decorators
 * including OpenAPI/Swagger decorators for dynamic entities
 */

import { ParameterStoreConfigModule } from "@elsikora/nestjs-aws-parameter-store-config";
import { ApiSubscriberModule } from "@elsikora/nestjs-crud-automator";
import { CrudConfigFullDynamicModule } from "@elsikora/nestjs-crud-config";
import { TypeOrmAwsConnectorModule, TypeOrmAwsConnectorService } from "@elsikora/nestjs-typeorm-aws-connector";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ChallengeModule } from "./modules/challenge/challenge.module";
// Import your application entities and modules
// import { Challenge } from "./modules/challenge/entity/challenge.entity";
// import { Client } from "./modules/client/entity/client.entity";
// import CONFIG_CONSTANT from "./shared/constant/config.constant";

@Module({
    imports: [
        // ChallengeModule,
        // ClientModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ApiSubscriberModule,
        
        // IMPORTANT: Register CrudConfigFullDynamicModule BEFORE TypeORM
        CrudConfigFullDynamicModule.register({
            cacheOptions: {
                isEnabled: true,
            },
            application: "my-app",
            entityOptions: {
                configData: {
                    maxValueLength: 16_384,
                    tableName: "configuration_data", // Will be app_configuration_data
                },
                configSection: {
                    maxNameLength: 256,
                    tableName: "configuration_sections", // Optional, defaults to config_section
                },
                tablePrefix: "app_", // All tables will have this prefix
            },
            environment: "development",
            isVerbose: true,
        }),
        
        EventEmitterModule.forRoot(),
        ParameterStoreConfigModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return {
                    application: config.get<string>("APPLICATION"),
                    config: {
                        region: config.get<string>("AWS_REGION"),
                    },
                    environment: config.get<string>("ENVIRONMENT"),
                    shouldDecryptParameters: true,
                    shouldUseRecursiveLoading: true,
                };
            },
        }),
        
        TypeOrmAwsConnectorModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                // Get the dynamic entities with full decorator support
                const configEntities = CrudConfigFullDynamicModule.getEntities();
                
                return {
                    connectionTimeoutMs: CONFIG_CONSTANT.DB_CONNECTION_TIMEOUT,
                    databaseName: CONFIG_CONSTANT.DB_DATABASE_NAME,
                    entities: [
                        // Your application entities
                        // Challenge, 
                        // Client,
                        ...configEntities, // Dynamic entities with ApiPropertyDescribe!
                    ],
                    idleTimeoutMs: CONFIG_CONSTANT.DB_IDLE_TIMEOUT,
                    isVerbose: CONFIG_CONSTANT.IS_DATABASE_LOGGING_ENABLED,
                    poolSize: CONFIG_CONSTANT.DB_POOL_SIZE,
                    port: CONFIG_CONSTANT.DB_PORT,
                    rotation: {
                        intervalMs: CONFIG_CONSTANT.DATABASE_CONNECTION_ROTATION_INTERVAL,
                        isEnabled: CONFIG_CONSTANT.IS_DATABASE_CONNECTION_ROTATION_ENABLED,
                    },
                    shouldSynchronize: CONFIG_CONSTANT.IS_DATABASE_SYNCHRONIZATION_ENABLED,
                    type: CONFIG_CONSTANT.DB_TYPE,
                };
            },
        }),
        
        TypeOrmModule.forRootAsync({
            inject: [TypeOrmAwsConnectorService],
            useFactory: async (service: TypeOrmAwsConnectorService) => {
                return {
                    ...(await service.getTypeOrmOptions()),
                };
            },
        }),
    ],
})
export class AppModule {}

/**
 * Example service using CrudConfigService with dynamic entities
 */
import { Injectable, OnModuleInit } from "@nestjs/common";
import { CrudConfigService } from "@elsikora/nestjs-crud-config";

@Injectable()
export class ConfigExampleService implements OnModuleInit {
    constructor(
        private readonly crudConfigService: CrudConfigService,
    ) {}

    async onModuleInit() {
        // Works perfectly with dynamic entities!
        const config = await this.crudConfigService.get({ 
            name: "API_KEY", 
            section: "api" 
        });
        console.log("Config from dynamic table with ApiPropertyDescribe:", config);
    }
}

/**
 * The dynamic entities now have:
 * 
 * ✅ Custom table names (app_configuration_data, app_configuration_sections)
 * ✅ Full ApiPropertyDescribe decorators for OpenAPI/Swagger
 * ✅ All TypeORM decorators (@Column, @CreateDateColumn, etc.)
 * ✅ Custom field lengths based on your configuration
 * ✅ Proper validation metadata
 * ✅ ConfigDataController and ConfigSectionController are included!
 * 
 * This means:
 * - Swagger documentation will work correctly
 * - Validation will use the proper constraints
 * - All CRUD automator features will work
 * - Your custom lengths and table names are applied
 * - REST API endpoints are available:
 *   - GET /config-section
 *   - POST /config-section
 *   - GET /config-section/:id
 *   - PUT /config-section/:id
 *   - DELETE /config-section/:id
 *   - GET /config-data
 *   - POST /config-data
 *   - GET /config-data/:id
 *   - PUT /config-data/:id
 *   - DELETE /config-data/:id
 */