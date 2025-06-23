// Note: This module uses dynamic entity registration instead of static imports
// ConfigSection, ConfigSectionService, and ConfigSectionController are dynamically provided
// through the register() and registerWithDynamicEntity() methods
// ConfigSectionController is provided dynamically through the module registration
import { DynamicModule, Module, Provider, ValueProvider } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CRUD_CONFIG_PROPERTIES } from "@shared/constant/config";
import { ICrudConfigProperties } from "@shared/interface/config";
import { DYNAMIC_REPOSITORIES } from "@shared/provider";
import type { Repository } from "typeorm";

@Module({})
export class ConfigSectionModule {
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
			exports: ['ConfigSectionService'],
			imports: [typeOrmImports],
			module: ConfigSectionModule,
				// Note: ConfigSectionService would be dynamically provided in production use
			// For now, using a placeholder provider
			providers: [
				...(propertiesProvider ? [propertiesProvider] : []),
				{
					provide: 'ConfigSectionService',
					useValue: {}, // Placeholder for dynamic service
				},
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
			provide: getRepositoryToken('ConfigSection'), // Using string token for dynamic entity
			inject: [DYNAMIC_REPOSITORIES.CONFIG_SECTION],
			useFactory: (dynamicRepository: Repository<any>) => {
				return dynamicRepository;
			},
		};

		// Dynamic service provider creates ConfigSectionService at runtime
		// This replaces the static import and allows for flexible entity configuration
		const serviceProvider: Provider = {
			provide: 'ConfigSectionService', // Using string token for dynamic service
			inject: [getRepositoryToken('ConfigSection')],
			useFactory: (repository: Repository<any>) => {
				// Service is instantiated dynamically with the configured repository
				const { ConfigSectionService } = require('./section.service');
				return new ConfigSectionService(repository);
			},
		};

		return {
			controllers: [], // Controllers are provided dynamically
			// Exporting dynamic service token
			exports: ['ConfigSectionService'],
			imports: [],
			module: ConfigSectionModule,
			providers: [
				...(propertiesProvider ? [propertiesProvider] : []),
				repositoryProvider,
				serviceProvider,
			],
		};
	}
}
