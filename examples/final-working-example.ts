/**
 * FINAL WORKING SOLUTION for your application
 * This uses CrudConfigSimpleDynamicModule which works reliably with TypeORM
 */

import { ParameterStoreConfigModule } from "@elsikora/nestjs-aws-parameter-store-config";
import { ApiSubscriberModule } from "@elsikora/nestjs-crud-automator";
import { CrudConfigSimpleDynamicModule } from "@elsikora/nestjs-crud-config";
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
        
        // Use CrudConfigSimpleDynamicModule - it works with dynamic table names!
        CrudConfigSimpleDynamicModule.register({
            cacheOptions: {
                isEnabled: true,
            },
            application: "my-app",
            entityOptions: {
                configData: {
                    maxValueLength: 16_384,
                    tableName: "configuration_data", // Will become app_configuration_data
                },
                configSection: {
                    maxNameLength: 256,
                    tableName: "configuration_sections", // Will become app_configuration_sections
                },
                tablePrefix: "app_", // Prefix for all tables
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
                // Get the schemas from CrudConfigSimpleDynamicModule
                const configSchemas = CrudConfigSimpleDynamicModule.getSchemas();
                
                return {
                    connectionTimeoutMs: CONFIG_CONSTANT.DB_CONNECTION_TIMEOUT,
                    databaseName: CONFIG_CONSTANT.DB_DATABASE_NAME,
                    entities: [
                        Challenge, 
                        Client,
                        ...configSchemas, // Add the dynamic schemas
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
 * Your ChallengeService remains EXACTLY THE SAME!
 * No changes needed - CrudConfigService works automatically
 */
import { Injectable, OnModuleInit } from "@nestjs/common";
import { CrudConfigService } from "@elsikora/nestjs-crud-config";

@Injectable()
export class ChallengeService implements OnModuleInit {
    constructor(
        private readonly crudConfigService: CrudConfigService,
    ) {}

    async onModuleInit() {
        // This works with the dynamic tables!
        const config = await this.crudConfigService.get({ 
            name: "API_KEY", 
            section: "section" 
        });
        console.log("Config from dynamic table:", config);
        
        // The data is stored in:
        // - app_configuration_data table
        // - app_configuration_sections table
    }
}