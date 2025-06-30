import type { DynamicModule, Provider, Type } from "@nestjs/common";

import { createConfigDataEntity } from "@modules/config/data";
import { createDynamicDataController } from "@modules/config/data/controller";
import { ConfigDataBeforeInsertListener } from "@modules/config/data/listener";
import { ConfigDataBeforeInsertSubscriber } from "@modules/config/data/subscriber";
import { createConfigSectionEntity } from "@modules/config/section";
import { createDynamicSectionController } from "@modules/config/section/controller";
import { CacheModule } from "@nestjs/cache-manager";
import { Global, Module } from "@nestjs/common";
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm";
import { CONFIG_DATA_CONSTANT, CONFIG_SECTION_CONSTANT, TOKEN_CONSTANT } from "@shared/constant";
import { IConfigOptions, IConfigPropertiesFactory, ICrudConfigAsyncModuleProperties } from "@shared/interface/config";
import { TDynamicEntity } from "@shared/type";
import { createDynamicService } from "@shared/utility";
import { DataSource } from "typeorm";

import { CrudConfigService } from "./config.service";

let globalSectionEntity: null | TDynamicEntity = null;
let globalDataEntity: null | TDynamicEntity = null;

/**
 * Full dynamic module with ApiPropertyDescribe support
 * This module creates entities with all decorators including ApiPropertyDescribe
 * Provides complete CRUD operations for configuration management
 */
@Global()
@Module({})
export class CrudConfigModule {
	/**
	 * Initialize and get the dynamic entities (for use in TypeORM configuration)
	 * @returns {Array<TDynamicEntity>} Array of dynamic entities
	 */
	public static getEntities(): Array<TDynamicEntity> {
		if (!globalSectionEntity || !globalDataEntity) {
			throw new Error("CrudConfigModule must be registered before accessing entities, or provide options to initialize them");
		}

		return [globalSectionEntity, globalDataEntity];
	}

	/**
	 * Registers the module with full dynamic entity support including ApiPropertyDescribe
	 * @param {IConfigOptions} options Configuration options for the module
	 * @returns {DynamicModule} Dynamic module configuration
	 */
	public static register(options: IConfigOptions): DynamicModule {
		const prefix: string = options.entityOptions?.tablePrefix ?? "";

		const sectionEntity: TDynamicEntity = createConfigSectionEntity({
			maxDescriptionLength: options.entityOptions?.configSection?.maxDescriptionLength ?? CONFIG_SECTION_CONSTANT.MAX_DESCRIPTION_LENGTH,
			maxNameLength: options.entityOptions?.configSection?.maxNameLength ?? CONFIG_SECTION_CONSTANT.MAX_NAME_LENGTH,
			tableName: prefix + (options.entityOptions?.configSection?.tableName ?? CONFIG_SECTION_CONSTANT.DEFAULT_TABLE_NAME),
		});

		const dataEntity: TDynamicEntity = createConfigDataEntity({
			configSectionEntity: sectionEntity,
			maxDescriptionLength: options.entityOptions?.configData?.maxDescriptionLength ?? CONFIG_DATA_CONSTANT.MAX_DESCRIPTION_LENGTH,
			maxEnvironmentLength: options.entityOptions?.configData?.maxEnvironmentLength ?? CONFIG_DATA_CONSTANT.MAX_ENVIRONMENT_LENGTH,
			maxNameLength: options.entityOptions?.configData?.maxNameLength ?? CONFIG_DATA_CONSTANT.MAX_NAME_LENGTH,
			maxValueLength: options.entityOptions?.configData?.maxValueLength ?? CONFIG_DATA_CONSTANT.MAX_VALUE_LENGTH,
			tableName: prefix + (options.entityOptions?.configData?.tableName ?? CONFIG_DATA_CONSTANT.DEFAULT_TABLE_NAME),
		});

		globalSectionEntity = sectionEntity;
		globalDataEntity = dataEntity;

		const propertiesProvider: Provider = {
			provide: TOKEN_CONSTANT.CONFIG_OPTIONS,
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
	 * @param {ICrudConfigAsyncModuleProperties} properties Async configuration options
	 * @returns {DynamicModule} Dynamic module configuration
	 */
	public static registerAsync(properties: ICrudConfigAsyncModuleProperties): DynamicModule {
		const configPropertiesProvider: Provider = this.createAsyncOptionsProvider(properties);

		const dynamicProvidersFactory: Provider = {
			inject: [TOKEN_CONSTANT.CONFIG_OPTIONS],
			provide: TOKEN_CONSTANT.DYNAMIC_PROVIDERS_FACTORY,
			useFactory: (options: IConfigOptions) => {
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
			exports: [TOKEN_CONSTANT.CONFIG_OPTIONS],
			imports: properties.imports ?? [],
			module: CrudConfigModule,
			providers,
		};
	}

	/**
	 * Creates an async options provider based on the configuration properties
	 * @param {ICrudConfigAsyncModuleProperties} properties Async configuration properties
	 * @returns {Provider} Provider configuration
	 */
	private static createAsyncOptionsProvider(properties: ICrudConfigAsyncModuleProperties): Provider {
		if (properties.useFactory) {
			return {
				inject: properties.inject ?? [],
				provide: TOKEN_CONSTANT.CONFIG_OPTIONS,
				useFactory: properties.useFactory,
			};
		}

		const inject: Type<IConfigPropertiesFactory> | undefined = properties.useExisting ?? properties.useClass;

		return {
			inject: inject ? [inject] : [],
			provide: TOKEN_CONSTANT.CONFIG_OPTIONS,
			useFactory: async (optionsFactory: IConfigPropertiesFactory): Promise<IConfigOptions> => {
				return optionsFactory.createOptions();
			},
		};
	}
}
