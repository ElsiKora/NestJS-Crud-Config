/**
 * Updated version of your AppModule using CrudConfigDynamicModule
 */

import { ParameterStoreConfigModule } from "@elsikora/nestjs-aws-parameter-store-config";
import { ApiSubscriberModule } from "@elsikora/nestjs-crud-automator";
// Import CrudConfigDynamicModule instead of CrudConfigModule
import { CrudConfigDynamicModule, CONFIG_SECTION_ENTITY, CONFIG_DATA_ENTITY } from "@elsikora/nestjs-crud-config";
import { TypeOrmAwsConnectorModule, TypeOrmAwsConnectorService } from "@elsikora/nestjs-typeorm-aws-connector";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ChallengeModule } from "./modules/challenge/challenge.module";
import { Challenge } from "./modules/challenge/entity/challenge.entity";
import { ClientModule } from "./modules/client/client.module";
import { Client } from "./modules/client/entity/client.entity";
import CONFIG_CONSTANT from "./shared/constant/config.constant";

@Module({
    imports: [
        ChallengeModule,
        ClientModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ApiSubscriberModule,
        
        // CHANGE 1: Use CrudConfigDynamicModule instead of CrudConfigModule
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
        
        // CHANGE 2: Update TypeOrmAwsConnectorModule to inject dynamic entities
        TypeOrmAwsConnectorModule.registerAsync({
            imports: [ConfigModule, CrudConfigDynamicModule], // Add CrudConfigDynamicModule to imports
            inject: [ConfigService, CONFIG_SECTION_ENTITY, CONFIG_DATA_ENTITY], // Inject dynamic entities
            useFactory: (config: ConfigService, configSectionEntity: any, configDataEntity: any) => {
                return {
                    connectionTimeoutMs: CONFIG_CONSTANT.DB_CONNECTION_TIMEOUT,
                    databaseName: CONFIG_CONSTANT.DB_DATABASE_NAME,
                    entities: [
                        Challenge, 
                        Client, 
                        // CHANGE 3: Use dynamic entities instead of static imports
                        configSectionEntity, 
                        configDataEntity
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
 * Your ChallengeService stays exactly the same!
 * CrudConfigService will automatically work with the dynamic entities
 */