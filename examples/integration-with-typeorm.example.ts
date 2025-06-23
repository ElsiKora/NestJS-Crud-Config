/**
 * Example of integrating CrudConfigDynamicModule with existing TypeORM setup
 * Shows how to properly inject and use dynamic entities in your TypeORM configuration
 */

import { ParameterStoreConfigModule } from "@elsikora/nestjs-aws-parameter-store-config";
import { ApiSubscriberModule } from "@elsikora/nestjs-crud-automator";
import { CrudConfigDynamicModule, CONFIG_SECTION_ENTITY, CONFIG_DATA_ENTITY, CrudConfigService } from "@elsikora/nestjs-crud-config";
import { TypeOrmAwsConnectorModule, TypeOrmAwsConnectorService } from "@elsikora/nestjs-typeorm-aws-connector";
import { Module, DynamicModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

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
        EventEmitterModule.forRoot(),
        
        // CrudConfigDynamicModule creates entities dynamically
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
                },
                tablePrefix: "app_",
            },
            environment: "development",
            isVerbose: true,
        }),
        
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
            imports: [ConfigModule, CrudConfigDynamicModule],
            inject: [ConfigService, CONFIG_SECTION_ENTITY, CONFIG_DATA_ENTITY],
            useFactory: (config: ConfigService, configSectionEntity: any, configDataEntity: any) => {
                return {
                    connectionTimeoutMs: CONFIG_CONSTANT.DB_CONNECTION_TIMEOUT,
                    databaseName: CONFIG_CONSTANT.DB_DATABASE_NAME,
                    // Include dynamic entities along with your app entities
                    entities: [
                        // Your application entities
                        // Challenge, 
                        // Client, 
                        configSectionEntity, // Dynamic ConfigSection entity
                        configDataEntity     // Dynamic ConfigData entity
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
 * Alternative approach if you need more control over entity registration
 */
@Module({})
export class AppModuleAlternative {
    static forRoot(): DynamicModule {
        return {
            module: AppModuleAlternative,
            imports: [
                ConfigModule.forRoot({
                    isGlobal: true,
                }),
                
                // First register the dynamic config module
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
                        },
                        tablePrefix: "app_",
                    },
                    environment: "development",
                    isVerbose: true,
                }),
                
                // Then configure TypeORM with a custom provider
                TypeOrmModule.forRootAsync({
                    imports: [CrudConfigDynamicModule],
                    inject: [CONFIG_SECTION_ENTITY, CONFIG_DATA_ENTITY],
                    useFactory: async (configSectionEntity: any, configDataEntity: any) => {
                        return {
                            type: 'postgres',
                            host: process.env.DB_HOST,
                            port: +process.env.DB_PORT,
                            username: process.env.DB_USER,
                            password: process.env.DB_PASS,
                            database: process.env.DB_NAME,
                            entities: [
                                // Your app entities
                                // Challenge,
                                // Client,
                                // Dynamic config entities
                                configSectionEntity,
                                configDataEntity,
                            ],
                            synchronize: process.env.NODE_ENV !== 'production',
                        };
                    },
                }),
                
                // Other modules
                // ChallengeModule,
                // ClientModule,
                ApiSubscriberModule,
                EventEmitterModule.forRoot(),
            ],
        };
    }
}

/**
 * If you need to access the dynamic entities in other parts of your application
 */
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CustomService {
    constructor(
        @Inject(CONFIG_SECTION_ENTITY) private readonly SectionEntity: any,
        @Inject(CONFIG_DATA_ENTITY) private readonly DataEntity: any,
    ) {
        // You can use these entity classes if needed
        console.log('Dynamic entities:', {
            section: this.SectionEntity.name,
            data: this.DataEntity.name,
        });
    }
}

/**
 * Example service using CrudConfigService with dynamic entities
 */
@Injectable()
export class ExampleService {
    constructor(
        private readonly crudConfigService: CrudConfigService, // Works with dynamic entities!
    ) {}

    async onModuleInit() {
        // This will work with dynamic entities
        const config = await this.crudConfigService.get({ 
            name: "API_KEY", 
            section: "section" 
        });
        console.log("Config from dynamic entity:", config);
    }
}