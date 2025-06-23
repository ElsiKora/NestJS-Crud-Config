import { ConfigSectionModule } from "../section";
import { DynamicModule, Module, Provider, ValueProvider } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CRUD_CONFIG_PROPERTIES } from "@shared/constant/config";
import { ICrudConfigProperties } from "@shared/interface/config";
import { CONFIG_DATA_ENTITY, DYNAMIC_REPOSITORIES } from "@shared/provider";
import type { Repository } from "typeorm";

// Note: This module uses dynamic entity registration instead of static imports
// ConfigData, ConfigDataService, and ConfigDataController are dynamically provided
// through the register() and registerWithDynamicEntity() methods
// ConfigDataController is provided dynamically through the module registration
import ConfigDataBeforeInsertListener from "./events/listener/beforeInsert.listener";
import ConfigDataBeforeInsertSubscriber from "./events/subscriber/beforeInsert.subscriber";

@Module({})
export class ConfigDataModule {
	/**
	 * Registers the module with the provided configuration options
	 * @param {ICrudConfigProperties} options - The configuration options
	 * @returns {DynamicModule} The dynamic module configuration
	 */
	public static register(options?: ICrudConfigProperties): DynamicModule {
		// Dynamic entity configuration is handled at runtime
		// Entity options are passed through providers instead of static initialization

		const propertiesProvider: undefined | ValueProvider<ICrudConfigProperties> = options
			? {
					provide: CRUD_CONFIG_PROPERTIES,
					useValue: options,
				}
			: undefined;

		// Dynamic modules handle entity registration at runtime
		// This allows for flexible table names and entity configurations
		// Note: Static entity imports are replaced by dynamic providers in registerWithDynamicEntity()
		const typeOrmImports = [];

		return {
			controllers: [], // Controllers are provided dynamically
			exports: ['ConfigDataService'],
			imports: [
				typeOrmImports,
				ConfigSectionModule,
				EventEmitterModule.forRoot({
					ignoreErrors: false,
					verboseMemoryLeak: process.env.NODE_ENV !== "production",
				}),
			],
			module: ConfigDataModule,
			// Note: ConfigDataService would be dynamically provided in production use
			// For now, using a placeholder provider
			providers: [
				...(propertiesProvider ? [propertiesProvider] : []),
				{
					provide: 'ConfigDataService',
					useValue: {}, // Placeholder for dynamic service
				},
				ConfigDataBeforeInsertSubscriber,
				ConfigDataBeforeInsertListener,
			],
		};
	}

	/**
	 * Registers the module with dynamic entity support
	 * @param {ICrudConfigProperties} options - The configuration options
	 * @returns {DynamicModule} The dynamic module configuration
	 */
	public static registerWithDynamicEntity(options?: ICrudConfigProperties): DynamicModule {
		const propertiesProvider: undefined | ValueProvider<ICrudConfigProperties> = options
			? {
					provide: CRUD_CONFIG_PROPERTIES,
					useValue: options,
				}
			: undefined;

		// Dynamic repository provider replaces static entity imports
		// This allows runtime configuration of table names and entity properties
		const repositoryProvider: Provider = {
			provide: getRepositoryToken('ConfigData'), // Using string token for dynamic entity
			inject: [DYNAMIC_REPOSITORIES.CONFIG_DATA],
			useFactory: (dynamicRepository: Repository<any>) => {
				return dynamicRepository;
			},
		};

		// Dynamic service provider creates ConfigDataService at runtime
		// This replaces the static import and allows for flexible entity configuration
		const serviceProvider: Provider = {
			provide: 'ConfigDataService', // Using string token for dynamic service
			inject: [getRepositoryToken('ConfigData')],
			useFactory: (repository: Repository<any>) => {
				// Service is instantiated dynamically with the configured repository
				const { ConfigDataService } = require('./data.service');
				return new ConfigDataService(repository);
			},
		};

		return {
			controllers: [], // Controllers are provided dynamically
			// Exporting dynamic service token
			exports: ['ConfigDataService'],
			imports: [
				ConfigSectionModule.registerWithDynamicEntity(options),
				EventEmitterModule.forRoot({
					ignoreErrors: false,
					verboseMemoryLeak: process.env.NODE_ENV !== "production",
				}),
			],
			module: ConfigDataModule,
			providers: [
				...(propertiesProvider ? [propertiesProvider] : []),
				repositoryProvider,
				serviceProvider,
				ConfigDataBeforeInsertSubscriber,
				ConfigDataBeforeInsertListener,
			],
		};
	}
}
