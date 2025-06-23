import type { DynamicModule, OnModuleInit, Provider, Type } from "@nestjs/common";

import { CacheModule } from "@nestjs/cache-manager";
import { Global, Inject, Module } from "@nestjs/common";
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm";
import { CRUD_CONFIG_PROPERTIES } from "@shared/constant/config";
import { createConfigDataEntity, createConfigSectionEntity, EntityClassType } from "@shared/factory";
import { ICrudConfigAsyncModuleProperties, ICrudConfigProperties, ICrudConfigPropertiesFactory } from "@shared/interface/config";
import { DataSource } from "typeorm";

import { CrudConfigService } from "./config.service";
import { createDynamicDataController, createDynamicSectionController } from "./controller.factory";
// Services and entities are created dynamically
import { createDynamicService } from "./service.factory";

// Module-level storage for entities
let globalSectionEntity: EntityClassType | null = null;
let globalDataEntity: EntityClassType | null = null;

/**
 * Full dynamic module with ApiPropertyDescribe support
 * This module creates entities with all decorators including ApiPropertyDescribe
 */
@Global()
@Module({})
export class CrudConfigModule implements OnModuleInit {
	constructor(@Inject(getDataSourceToken()) private readonly dataSource: DataSource) {}

	/**
	 * Initialize and get the dynamic entities (for use in TypeORM configuration)
	 * @param options - The configuration options (optional if already registered)
	 */
	public static getEntities(options?: ICrudConfigProperties): Array<EntityClassType> {
		if (!globalSectionEntity || !globalDataEntity) {
			if (!options) {
				throw new Error("CrudConfigFullDynamicModule must be registered before accessing entities, or provide options to initialize them");
			}
			// Initialize entities if not already done
			const prefix = options.entityOptions?.tablePrefix || "";

			// Create entities with full decorator support
			globalSectionEntity = createConfigSectionEntity({
				maxDescriptionLength: options.entityOptions?.configSection?.maxDescriptionLength || 512,
				maxNameLength: options.entityOptions?.configSection?.maxNameLength || 128,
				tableName: prefix + (options.entityOptions?.configSection?.tableName || "config_section"),
			});

			globalDataEntity = createConfigDataEntity({
				configSectionEntity: globalSectionEntity,
				maxDescriptionLength: options.entityOptions?.configData?.maxDescriptionLength || 512,
				maxEnvironmentLength: options.entityOptions?.configData?.maxEnvironmentLength || 64,
				maxNameLength: options.entityOptions?.configData?.maxNameLength || 128,
				maxValueLength: options.entityOptions?.configData?.maxValueLength || 8192,
				tableName: prefix + (options.entityOptions?.configData?.tableName || "config_data"),
			});
		}

		return [globalSectionEntity, globalDataEntity];
	}

	/**
	 * Registers the module with full dynamic entity support including ApiPropertyDescribe
	 * @param options
	 */
	public static register(options: ICrudConfigProperties): DynamicModule {
		const prefix = options.entityOptions?.tablePrefix || "";

		// Create entities with full decorator support
		const sectionEntity = createConfigSectionEntity({
			maxDescriptionLength: options.entityOptions?.configSection?.maxDescriptionLength || 512,
			maxNameLength: options.entityOptions?.configSection?.maxNameLength || 128,
			tableName: prefix + (options.entityOptions?.configSection?.tableName || "config_section"),
		});

		const dataEntity = createConfigDataEntity({
			configSectionEntity: sectionEntity,
			maxDescriptionLength: options.entityOptions?.configData?.maxDescriptionLength || 512,
			maxEnvironmentLength: options.entityOptions?.configData?.maxEnvironmentLength || 64,
			maxNameLength: options.entityOptions?.configData?.maxNameLength || 128,
			maxValueLength: options.entityOptions?.configData?.maxValueLength || 8192,
			tableName: prefix + (options.entityOptions?.configData?.tableName || "config_data"),
		});

		// Store entities globally
		globalSectionEntity = sectionEntity;
		globalDataEntity = dataEntity;

		const propertiesProvider: Provider = {
			provide: CRUD_CONFIG_PROPERTIES,
			useValue: options,
		};

		// Entity providers
		const sectionEntityProvider: Provider = {
			provide: "CONFIG_SECTION_ENTITY",
			useValue: sectionEntity,
		};

		const dataEntityProvider: Provider = {
			provide: "CONFIG_DATA_ENTITY",
			useValue: dataEntity,
		};

		// Repository providers for dynamic entities
		const sectionRepositoryProvider: Provider = {
			inject: [getDataSourceToken()],
			provide: getRepositoryToken(sectionEntity),
			useFactory: (dataSource: DataSource) => {
				return dataSource.getRepository(sectionEntity);
			},
		};

		const dataRepositoryProvider: Provider = {
			inject: [getDataSourceToken()],
			provide: getRepositoryToken(dataEntity),
			useFactory: (dataSource: DataSource) => {
				return dataSource.getRepository(dataEntity);
			},
		};

		// Repository providers for backward compatibility tokens
		const sectionRepositoryOriginalProvider: Provider = {
			inject: [getDataSourceToken()],
			provide: "ConfigSectionRepository",
			useFactory: (dataSource: DataSource) => {
				return dataSource.getRepository(sectionEntity);
			},
		};

		const dataRepositoryOriginalProvider: Provider = {
			inject: [getDataSourceToken()],
			provide: "ConfigDataRepository",
			useFactory: (dataSource: DataSource) => {
				return dataSource.getRepository(dataEntity);
			},
		};

		// Create dynamic service classes using factory
		const DynamicConfigSectionService = createDynamicService(sectionEntity, "DynamicConfigSectionService");
		const DynamicConfigDataService = createDynamicService(dataEntity, "DynamicConfigDataService");

		// Service providers
		const sectionServiceProvider: Provider = {
			provide: "ConfigSectionService",
			useClass: DynamicConfigSectionService,
		};

		const dataServiceProvider: Provider = {
			provide: "ConfigDataService",
			useClass: DynamicConfigDataService,
		};

		// Create dynamic controller classes using factory
		const DynamicConfigSectionController = createDynamicSectionController(sectionEntity);
		const DynamicConfigDataController = createDynamicDataController(dataEntity);

		// Entity registration provider
		const entityRegistrationProvider: Provider = {
			inject: [getDataSourceToken()],
			provide: "ENTITY_REGISTRATION",
			useFactory: async (dataSource: DataSource) => {
				// Add entities to data source if not already added
				const entityMetadatas = dataSource.entityMetadatas;
				const hasSection = entityMetadatas.some((meta) => meta.target === sectionEntity);
				const hasData = entityMetadatas.some((meta) => meta.target === dataEntity);

				if (!hasSection || !hasData) {
					// This will be handled by TypeORM when creating repositories
					console.log("Dynamic entities will be registered when repositories are created");
				}

				return { dataEntity, sectionEntity };
			},
		};

		const imports: Array<DynamicModule> = [];

		if (options.cacheOptions?.isEnabled) {
			imports.push(
				CacheModule.register({
					max: options.cacheOptions.maxCacheItems,
					ttl: options.cacheOptions.maxCacheTTL,
				}),
			);
		}

		// Provider for section service in data controller
		const sectionServiceForControllerProvider: Provider = {
			provide: "sectionService",
			useExisting: "ConfigSectionService",
		};

		return {
			controllers: [DynamicConfigSectionController, DynamicConfigDataController],
			exports: ["ConfigSectionService", "ConfigDataService", CrudConfigService, "ConfigSectionRepository", "ConfigDataRepository", "CONFIG_SECTION_ENTITY", "CONFIG_DATA_ENTITY", "ENTITY_REGISTRATION"],
			imports,
			module: CrudConfigModule,
			providers: [propertiesProvider, sectionEntityProvider, dataEntityProvider, sectionRepositoryProvider, dataRepositoryProvider, sectionRepositoryOriginalProvider, dataRepositoryOriginalProvider, sectionServiceProvider, dataServiceProvider, sectionServiceForControllerProvider, entityRegistrationProvider, CrudConfigService],
		};
	}

	/**
	 * Registers the module asynchronously
	 * @param properties
	 */
	public static registerAsync(properties: ICrudConfigAsyncModuleProperties): DynamicModule {
		const configPropertiesProvider = this.createAsyncOptionsProvider(properties);

		const dynamicProvidersFactory: Provider = {
			inject: [CRUD_CONFIG_PROPERTIES],
			provide: "DYNAMIC_PROVIDERS_FACTORY",
			useFactory: (options: ICrudConfigProperties) => {
				return this.register(options);
			},
		};

		const providers: Array<Provider> = [configPropertiesProvider, dynamicProvidersFactory];

		if (properties.useClass && !properties.useExisting) {
			providers.push({
				provide: properties.useClass,
				useClass: properties.useClass,
			});
		}

		return {
			exports: [CRUD_CONFIG_PROPERTIES],
			imports: properties.imports || [],
			module: CrudConfigModule,
			providers,
		};
	}

	private static createAsyncOptionsProvider(properties: ICrudConfigAsyncModuleProperties): Provider {
		if (properties.useFactory) {
			return {
				inject: properties.inject || [],
				provide: CRUD_CONFIG_PROPERTIES,
				useFactory: properties.useFactory,
			};
		}

		const inject: Type<ICrudConfigPropertiesFactory> | undefined = properties.useExisting || properties.useClass;

		return {
			inject: inject ? [inject] : [],
			provide: CRUD_CONFIG_PROPERTIES,
			useFactory: async (optionsFactory: ICrudConfigPropertiesFactory): Promise<ICrudConfigProperties> => {
				return optionsFactory.createOptions();
			},
		};
	}

	async onModuleInit() {
		// Entities are already registered via providers
		console.log(
			"CrudConfigFullDynamicModule initialized with entities:",
			this.dataSource.entityMetadatas.map((e) => e.tableName),
		);
	}
}
