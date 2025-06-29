import type { DynamicModule, OnModuleInit, Provider, Type } from "@nestjs/common";

import { ConfigDataBeforeInsertListener, ConfigDataBeforeInsertSubscriber, createConfigDataEntity } from "@modules/config/data";
import { createDynamicDataController } from "@modules/config/data/controller";
import { createConfigSectionEntity } from "@modules/config/section";
import { createDynamicSectionController } from "@modules/config/section/controller";
import { CacheModule } from "@nestjs/cache-manager";
import { Global, Module } from "@nestjs/common";
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm";
import { TOKEN_CONSTANT } from "@shared/constant";
import { CONFIG_DATA_DEFAULTS, CONFIG_SECTION_DEFAULTS } from "@shared/constant/config";
import { ICrudConfigAsyncModuleProperties, ICrudConfigProperties, ICrudConfigPropertiesFactory } from "@shared/interface/config";
import { TDynamicEntity } from "@shared/type";
import { createDynamicService } from "@shared/utility/create-dynamic-service.utility";
import { DataSource } from "typeorm";

import { CrudConfigService } from "./config.service";
// Services and entities are created dynamically

// Module-level storage for entities
let globalSectionEntity: null | TDynamicEntity = null;
let globalDataEntity: null | TDynamicEntity = null;

/**
 * Full dynamic module with ApiPropertyDescribe support
 * This module creates entities with all decorators including ApiPropertyDescribe
 * Provides complete CRUD operations for configuration management
 */
@Global()
@Module({})
export class CrudConfigModule implements OnModuleInit {
	constructor() {}

	/**
	 * Initialize and get the dynamic entities (for use in TypeORM configuration)
	 * @param options - The configuration options (optional if already registered)
	 */
	public static getEntities(options?: ICrudConfigProperties): Array<TDynamicEntity> {
		if (!globalSectionEntity || !globalDataEntity) {
			if (!options) {
				throw new Error("CrudConfigFullDynamicModule must be registered before accessing entities, or provide options to initialize them");
			}
			// Initialize entities if not already done
			const prefix: string = options.entityOptions?.tablePrefix ?? "";

			// Create entities with full decorator support
			globalSectionEntity = createConfigSectionEntity({
				maxDescriptionLength: options.entityOptions?.configSection?.maxDescriptionLength ?? CONFIG_SECTION_DEFAULTS.MAX_DESCRIPTION_LENGTH,
				maxNameLength: options.entityOptions?.configSection?.maxNameLength ?? CONFIG_SECTION_DEFAULTS.MAX_NAME_LENGTH,
				tableName: prefix + (options.entityOptions?.configSection?.tableName ?? CONFIG_SECTION_DEFAULTS.DEFAULT_TABLE_NAME),
			});

			globalDataEntity = createConfigDataEntity({
				configSectionEntity: globalSectionEntity,
				maxDescriptionLength: options.entityOptions?.configData?.maxDescriptionLength ?? CONFIG_DATA_DEFAULTS.MAX_DESCRIPTION_LENGTH,
				maxEnvironmentLength: options.entityOptions?.configData?.maxEnvironmentLength ?? CONFIG_DATA_DEFAULTS.MAX_ENVIRONMENT_LENGTH,
				maxNameLength: options.entityOptions?.configData?.maxNameLength ?? CONFIG_DATA_DEFAULTS.MAX_NAME_LENGTH,
				maxValueLength: options.entityOptions?.configData?.maxValueLength ?? CONFIG_DATA_DEFAULTS.MAX_VALUE_LENGTH,
				tableName: prefix + (options.entityOptions?.configData?.tableName ?? CONFIG_DATA_DEFAULTS.DEFAULT_TABLE_NAME),
			});
		}

		return [globalSectionEntity, globalDataEntity];
	}

	/**
	 * Registers the module with full dynamic entity support including ApiPropertyDescribe
	 * @param options Configuration options for the module
	 * @returns Dynamic module configuration
	 */
	public static register(options: ICrudConfigProperties): DynamicModule {
		const prefix: string = options.entityOptions?.tablePrefix ?? "";

		// Create entities with full decorator support
		const sectionEntity: TDynamicEntity = createConfigSectionEntity({
			maxDescriptionLength: options.entityOptions?.configSection?.maxDescriptionLength ?? CONFIG_SECTION_DEFAULTS.MAX_DESCRIPTION_LENGTH,
			maxNameLength: options.entityOptions?.configSection?.maxNameLength ?? CONFIG_SECTION_DEFAULTS.MAX_NAME_LENGTH,
			tableName: prefix + (options.entityOptions?.configSection?.tableName ?? CONFIG_SECTION_DEFAULTS.DEFAULT_TABLE_NAME),
		});

		const dataEntity: TDynamicEntity = createConfigDataEntity({
			configSectionEntity: sectionEntity,
			maxDescriptionLength: options.entityOptions?.configData?.maxDescriptionLength ?? CONFIG_DATA_DEFAULTS.MAX_DESCRIPTION_LENGTH,
			maxEnvironmentLength: options.entityOptions?.configData?.maxEnvironmentLength ?? CONFIG_DATA_DEFAULTS.MAX_ENVIRONMENT_LENGTH,
			maxNameLength: options.entityOptions?.configData?.maxNameLength ?? CONFIG_DATA_DEFAULTS.MAX_NAME_LENGTH,
			maxValueLength: options.entityOptions?.configData?.maxValueLength ?? CONFIG_DATA_DEFAULTS.MAX_VALUE_LENGTH,
			tableName: prefix + (options.entityOptions?.configData?.tableName ?? CONFIG_DATA_DEFAULTS.DEFAULT_TABLE_NAME),
		});

		// Store entities globally
		globalSectionEntity = sectionEntity;
		globalDataEntity = dataEntity;

		const propertiesProvider: Provider = {
			provide: TOKEN_CONSTANT.CONFIG_PROPERTIES,
			useValue: options,
		};

		const sectionEntityProvider: Provider = {
			provide: TOKEN_CONSTANT.CONFIG_SECTION_ENTITY,
			useValue: sectionEntity,
		};

		const dataEntityProvider: Provider = {
			provide: TOKEN_CONSTANT.CONFIG_DATA_ENTITY,
			useValue: dataEntity,
		};

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

		const DynamicConfigSectionService: Type<unknown> = createDynamicService(sectionEntity, "ConfigSectionService");
		const DynamicConfigDataService: Type<unknown> = createDynamicService(dataEntity, "ConfigDataService");

		const sectionServiceProvider: Provider = {
			provide: TOKEN_CONSTANT.CONFIG_SECTION_SERVICE,
			useClass: DynamicConfigSectionService,
		};

		const dataServiceProvider: Provider = {
			provide: TOKEN_CONSTANT.CONFIG_DATA_SERVICE,
			useClass: DynamicConfigDataService,
		};

		// Create dynamic controller classes using factory
		const DynamicConfigSectionController: Type = createDynamicSectionController(sectionEntity);
		const DynamicConfigDataController: Type = createDynamicDataController(dataEntity);

		const imports: Array<DynamicModule> = [];

		if (options.cacheOptions?.isEnabled) {
			imports.push(
				CacheModule.register({
					max: options.cacheOptions.maxCacheItems,
					ttl: options.cacheOptions.maxCacheTTL,
				}),
			);
		}

		return {
			controllers: [DynamicConfigSectionController, DynamicConfigDataController],
			exports: [CrudConfigService, TOKEN_CONSTANT.CONFIG_SECTION_SERVICE],
			imports,
			module: CrudConfigModule,
			providers: [propertiesProvider, sectionEntityProvider, dataEntityProvider, sectionRepositoryProvider, dataRepositoryProvider, sectionServiceProvider, dataServiceProvider, CrudConfigService, ConfigDataBeforeInsertListener, ConfigDataBeforeInsertSubscriber],
		};
	}

	/**
	 * Registers the module asynchronously
	 * @param properties Async configuration options
	 * @returns Dynamic module configuration
	 */
	public static registerAsync(properties: ICrudConfigAsyncModuleProperties): DynamicModule {
		const configPropertiesProvider = this.createAsyncOptionsProvider(properties);

		const dynamicProvidersFactory: Provider = {
			inject: [TOKEN_CONSTANT.CONFIG_PROPERTIES],
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
			exports: [TOKEN_CONSTANT.CONFIG_PROPERTIES],
			imports: properties.imports ?? [],
			module: CrudConfigModule,
			providers,
		};
	}

	/**
	 * Creates an async options provider based on the configuration properties
	 * @param properties Async configuration properties
	 * @returns Provider configuration
	 */
	private static createAsyncOptionsProvider(properties: ICrudConfigAsyncModuleProperties): Provider {
		if (properties.useFactory) {
			return {
				inject: properties.inject ?? [],
				provide: TOKEN_CONSTANT.CONFIG_PROPERTIES,
				useFactory: properties.useFactory,
			};
		}

		const inject: Type<ICrudConfigPropertiesFactory> | undefined = properties.useExisting || properties.useClass;

		return {
			inject: inject ? [inject] : [],
			provide: TOKEN_CONSTANT.CONFIG_PROPERTIES,
			useFactory: async (optionsFactory: ICrudConfigPropertiesFactory): Promise<ICrudConfigProperties> => {
				return optionsFactory.createOptions();
			},
		};
	}

	/**
	 * Lifecycle hook called after the module has been initialized
	 */
	onModuleInit(): void {
		// Entities are already registered via providers
		// CrudConfigFullDynamicModule initialized with entities
	}
}
