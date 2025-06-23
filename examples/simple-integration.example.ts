/**
 * Simplified integration example - easiest way to use dynamic entities
 */

import { ParameterStoreConfigModule } from "@elsikora/nestjs-aws-parameter-store-config";
import { ApiSubscriberModule } from "@elsikora/nestjs-crud-automator";
import { CrudConfigDynamicModule } from "@elsikora/nestjs-crud-config";
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
        
        // Step 1: Use CrudConfigDynamicModule
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
        
        // Step 2: Simple approach - just list all your entities manually
        // The dynamic config entities will be registered automatically by CrudConfigDynamicModule
        TypeOrmAwsConnectorModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return {
                    connectionTimeoutMs: CONFIG_CONSTANT.DB_CONNECTION_TIMEOUT,
                    databaseName: CONFIG_CONSTANT.DB_DATABASE_NAME,
                    entities: [
                        Challenge, 
                        Client,
                        // No need to manually add config entities here!
                        // CrudConfigDynamicModule handles entity registration
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
 * Alternative: If automatic registration doesn't work, use a custom approach
 */
import { DataSource } from 'typeorm';
import { ENTITY_MANAGER_KEY } from '@nestjs/typeorm/dist/typeorm.constants';

@Module({})
export class AppModuleWithManualRegistration {
    constructor(private dataSource: DataSource) {
        // The entities will be automatically registered by CrudConfigDynamicModule
        console.log('Registered entities:', this.dataSource.entityMetadatas.map(e => e.tableName));
    }
}

/**
 * Your services remain unchanged - they work automatically with dynamic entities
 */
import { Injectable } from '@nestjs/common';
import { CrudConfigService } from '@elsikora/nestjs-crud-config';

@Injectable()
export class YourService {
    constructor(
        private readonly crudConfigService: CrudConfigService,
    ) {}

    async example() {
        // This works exactly the same with dynamic entities!
        const config = await this.crudConfigService.get({ 
            name: "API_KEY", 
            section: "section" 
        });
        
        // The tables will be created as:
        // - app_configuration_data (instead of config_data)
        // - app_config_section (instead of config_section)
    }
}