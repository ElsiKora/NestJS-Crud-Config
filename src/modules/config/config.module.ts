import { ApiServiceBase, IApiBaseEntity } from "@elsikora/nestjs-crud-automator";
import { createConfigDataEntity, IConfigData } from "@modules/config/data";
import { createDynamicDataController } from "@modules/config/data/controller";
import { ConfigDataBeforeInsertListener } from "@modules/config/data/listener";
import { ConfigDataBeforeInsertSubscriber } from "@modules/config/data/subscriber";
import { createConfigMigrationEntity, IConfigMigration } from "@modules/config/migration";
import { ConfigMigrationService } from "@modules/config/migration";
import { ConfigMigrationRunnerService } from "@modules/config/migration";
import { createConfigSectionEntity, IConfigSection } from "@modules/config/section";
import { createDynamicSectionController } from "@modules/config/section/controller";
import { CacheModule } from "@nestjs/cache-manager";
import { DynamicModule, Provider, Type } from "@nestjs/common";
import { Global, Module } from "@nestjs/common";
import { getDataSourceToken, getRepositoryToken } from "@nestjs/typeorm";
import {
 CONFIG_DATA_CONSTANT,
 CONFIG_MIGRATION_CONSTANT,
 CONFIG_SECTION_CONSTANT,
 TOKEN_CONSTANT,
} from "@shared/constant";
import {
 IConfigOptions,
 IConfigPropertiesFactory,
 ICrudConfigAsyncModuleProperties,
} from "@shared/interface/config";
import { TDynamicEntity } from "@shared/type";
import { createDynamicService, CryptoUtility } from "@shared/utility";
import { DataSource, Repository } from "typeorm";

import { CrudConfigService } from "./config.service";

@Global()
@Module({})
export class CrudConfigModule {
 public static register(options: IConfigOptions): DynamicModule {
  const prefix: string = options.entityOptions?.tablePrefix ?? "";

  const sectionEntity: TDynamicEntity = createConfigSectionEntity({
   maxDescriptionLength:
    options.entityOptions?.configSection?.maxDescriptionLength ??
    CONFIG_SECTION_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxNameLength:
    options.entityOptions?.configSection?.maxNameLength ?? CONFIG_SECTION_CONSTANT.MAX_NAME_LENGTH,
   tableName:
    prefix +
    (options.entityOptions?.configSection?.tableName ?? CONFIG_SECTION_CONSTANT.DEFAULT_TABLE_NAME),
  });

  const dataEntity: TDynamicEntity = createConfigDataEntity({
   configSectionEntity: sectionEntity,
   maxDescriptionLength:
    options.entityOptions?.configData?.maxDescriptionLength ??
    CONFIG_DATA_CONSTANT.MAX_DESCRIPTION_LENGTH,
   maxEnvironmentLength:
    options.entityOptions?.configData?.maxEnvironmentLength ??
    CONFIG_DATA_CONSTANT.MAX_ENVIRONMENT_LENGTH,
   maxNameLength:
    options.entityOptions?.configData?.maxNameLength ?? CONFIG_DATA_CONSTANT.MAX_NAME_LENGTH,
   maxValueLength:
    options.entityOptions?.configData?.maxValueLength ?? CONFIG_DATA_CONSTANT.MAX_VALUE_LENGTH,
   tableName:
    prefix +
    (options.entityOptions?.configData?.tableName ?? CONFIG_DATA_CONSTANT.DEFAULT_TABLE_NAME),
  });

  const migrationEntity: TDynamicEntity = createConfigMigrationEntity({
   maxNameLength:
    options.migrationOptions?.maxNameLength ?? CONFIG_MIGRATION_CONSTANT.MAX_NAME_LENGTH,
   tableName:
    prefix + (options.migrationOptions?.tableName ?? CONFIG_MIGRATION_CONSTANT.DEFAULT_TABLE_NAME),
  });

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

  const migrationEntityProvider: Provider = {
   provide: TOKEN_CONSTANT.CONFIG_MIGRATION_ENTITY,
   useValue: migrationEntity,
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

  const migrationRepositoryProvider: Provider = {
   inject: [getDataSourceToken()],
   provide: getRepositoryToken(migrationEntity),
   useFactory: (dataSource: DataSource) => {
    return dataSource.getRepository(migrationEntity);
   },
  };

  const DynamicConfigSectionService: Type<unknown> = createDynamicService(
   sectionEntity,
   "ConfigSectionService",
  );

  const DynamicConfigDataService: Type<unknown> = createDynamicService(
   dataEntity,
   "ConfigDataService",
  );

  const sectionServiceProvider: Provider = {
   provide: TOKEN_CONSTANT.CONFIG_SECTION_SERVICE,
   useClass: DynamicConfigSectionService,
  };

  const dataServiceProvider: Provider = {
   provide: TOKEN_CONSTANT.CONFIG_DATA_SERVICE,
   useClass: DynamicConfigDataService,
  };

  const DynamicConfigMigrationService: Type<unknown> = createDynamicService(
   migrationEntity,
   "ConfigMigrationService",
  );

  const migrationServiceProvider: Provider = {
   provide: TOKEN_CONSTANT.CONFIG_MIGRATION_SERVICE,
   useClass: DynamicConfigMigrationService,
  };

  const DynamicConfigSectionController: null | Type =
   options.controllersOptions?.section?.isEnabled === false
    ? null
    : createDynamicSectionController(sectionEntity, options.controllersOptions?.section);

  const DynamicConfigDataController: null | Type =
   options.controllersOptions?.data?.isEnabled === false
    ? null
    : createDynamicDataController(dataEntity, options.controllersOptions?.data);

  const imports: Array<DynamicModule> = [];

  if (options.cacheOptions?.isEnabled) {
   imports.push(
    CacheModule.register({
     max: options.cacheOptions.maxCacheItems,
     ttl: options.cacheOptions.maxCacheTTL,
    }),
   );
  }

  const controllers: Array<Type> = [];

  if (DynamicConfigSectionController) controllers.push(DynamicConfigSectionController);

  if (DynamicConfigDataController) controllers.push(DynamicConfigDataController);

  return {
   controllers,
   exports: [
    CrudConfigService,
    TOKEN_CONSTANT.CONFIG_SECTION_ENTITY,
    TOKEN_CONSTANT.CONFIG_DATA_ENTITY,
    TOKEN_CONSTANT.CONFIG_MIGRATION_ENTITY,
    TOKEN_CONSTANT.CONFIG_SECTION_SERVICE,
    TOKEN_CONSTANT.CONFIG_DATA_SERVICE,
    TOKEN_CONSTANT.CONFIG_MIGRATION_SERVICE,
    ConfigMigrationService,
    ConfigMigrationRunnerService,
    CryptoUtility,
   ],
   imports,
   module: CrudConfigModule,
   providers: [
    propertiesProvider,
    sectionEntityProvider,
    dataEntityProvider,
    migrationEntityProvider,
    sectionRepositoryProvider,
    dataRepositoryProvider,
    migrationRepositoryProvider,
    sectionServiceProvider,
    dataServiceProvider,
    migrationServiceProvider,
    CrudConfigService,
    ConfigMigrationService,
    ConfigMigrationRunnerService,
    ConfigDataBeforeInsertListener,
    ConfigDataBeforeInsertSubscriber,
    CryptoUtility,
   ],
  };
 }

 /**
  * Registers the module asynchronously. This implementation defers all dynamic provider
  * creation into factories to ensure correct instantiation order.
  * @param {ICrudConfigAsyncModuleProperties} properties Async configuration options
  * @returns {DynamicModule} Dynamic module configuration
  */
 public static registerAsync(properties: ICrudConfigAsyncModuleProperties): DynamicModule {
  const providers: Array<Provider> = [
   this.createAsyncOptionsProvider(properties),

   {
    inject: [TOKEN_CONSTANT.CONFIG_OPTIONS],
    provide: TOKEN_CONSTANT.CONFIG_SECTION_ENTITY,
    useFactory: (options: IConfigOptions): TDynamicEntity => {
     const prefix: string = options.entityOptions?.tablePrefix ?? "";

     return createConfigSectionEntity({
      maxDescriptionLength:
       options.entityOptions?.configSection?.maxDescriptionLength ??
       CONFIG_SECTION_CONSTANT.MAX_DESCRIPTION_LENGTH,
      maxNameLength:
       options.entityOptions?.configSection?.maxNameLength ??
       CONFIG_SECTION_CONSTANT.MAX_NAME_LENGTH,
      tableName:
       prefix +
       (options.entityOptions?.configSection?.tableName ??
        CONFIG_SECTION_CONSTANT.DEFAULT_TABLE_NAME),
     });
    },
   },

   {
    inject: [TOKEN_CONSTANT.CONFIG_OPTIONS, TOKEN_CONSTANT.CONFIG_SECTION_ENTITY],
    provide: TOKEN_CONSTANT.CONFIG_DATA_ENTITY,
    useFactory: (options: IConfigOptions, configSectionEntity: TDynamicEntity): TDynamicEntity => {
     const prefix: string = options.entityOptions?.tablePrefix ?? "";

     return createConfigDataEntity({
      configSectionEntity,
      maxDescriptionLength:
       options.entityOptions?.configData?.maxDescriptionLength ??
       CONFIG_DATA_CONSTANT.MAX_DESCRIPTION_LENGTH,
      maxEnvironmentLength:
       options.entityOptions?.configData?.maxEnvironmentLength ??
       CONFIG_DATA_CONSTANT.MAX_ENVIRONMENT_LENGTH,
      maxNameLength:
       options.entityOptions?.configData?.maxNameLength ?? CONFIG_DATA_CONSTANT.MAX_NAME_LENGTH,
      maxValueLength:
       options.entityOptions?.configData?.maxValueLength ?? CONFIG_DATA_CONSTANT.MAX_VALUE_LENGTH,
      tableName:
       prefix +
       (options.entityOptions?.configData?.tableName ?? CONFIG_DATA_CONSTANT.DEFAULT_TABLE_NAME),
     });
    },
   },

   {
    inject: [TOKEN_CONSTANT.CONFIG_OPTIONS],
    provide: TOKEN_CONSTANT.CONFIG_MIGRATION_ENTITY,
    useFactory: (options: IConfigOptions): TDynamicEntity => {
     const prefix: string = options.entityOptions?.tablePrefix ?? "";

     return createConfigMigrationEntity({
      maxNameLength:
       options.migrationOptions?.maxNameLength ?? CONFIG_MIGRATION_CONSTANT.MAX_NAME_LENGTH,
      tableName:
       prefix +
       (options.migrationOptions?.tableName ?? CONFIG_MIGRATION_CONSTANT.DEFAULT_TABLE_NAME),
     });
    },
   },

   {
    inject: [getDataSourceToken(), TOKEN_CONSTANT.CONFIG_SECTION_ENTITY],
    provide: TOKEN_CONSTANT.CONFIG_SECTION_SERVICE,
    useFactory: (
     dataSource: DataSource,
     sectionEntity: TDynamicEntity,
    ): ApiServiceBase<IConfigSection> => {
     const repository: Repository<IApiBaseEntity> = dataSource.getRepository(sectionEntity);
     const DynamicService: Type = createDynamicService(sectionEntity, "ConfigSectionService");

     return new DynamicService(repository) as ApiServiceBase<IConfigSection>;
    },
   },

   {
    inject: [getDataSourceToken(), TOKEN_CONSTANT.CONFIG_DATA_ENTITY],
    provide: TOKEN_CONSTANT.CONFIG_DATA_SERVICE,
    useFactory: (
     dataSource: DataSource,
     dataEntity: TDynamicEntity,
    ): ApiServiceBase<IConfigData> => {
     const repository: Repository<IApiBaseEntity> = dataSource.getRepository(dataEntity);
     const DynamicService: Type = createDynamicService(dataEntity, "ConfigDataService");

     return new DynamicService(repository) as ApiServiceBase<IConfigData>;
    },
   },

   {
    inject: [getDataSourceToken(), TOKEN_CONSTANT.CONFIG_MIGRATION_ENTITY],
    provide: TOKEN_CONSTANT.CONFIG_MIGRATION_SERVICE,
    useFactory: (
     dataSource: DataSource,
     migrationEntity: TDynamicEntity,
    ): ApiServiceBase<IConfigMigration> => {
     const repository: Repository<IApiBaseEntity> = dataSource.getRepository(migrationEntity);
     const DynamicService: Type = createDynamicService(migrationEntity, "ConfigMigrationService");

     return new DynamicService(repository) as ApiServiceBase<IConfigMigration>;
    },
   },

   CrudConfigService,
   ConfigMigrationService,
   ConfigMigrationRunnerService,
   ConfigDataBeforeInsertListener,
   ConfigDataBeforeInsertSubscriber,
   CryptoUtility,
  ];

  if (properties.useClass) {
   providers.push({
    provide: properties.useClass,
    useClass: properties.useClass,
   });
  }

  return {
   controllers: [],
   exports: [
    CrudConfigService,
    TOKEN_CONSTANT.CONFIG_OPTIONS,
    TOKEN_CONSTANT.CONFIG_SECTION_ENTITY,
    TOKEN_CONSTANT.CONFIG_DATA_ENTITY,
    TOKEN_CONSTANT.CONFIG_MIGRATION_ENTITY,
    TOKEN_CONSTANT.CONFIG_SECTION_SERVICE,
    TOKEN_CONSTANT.CONFIG_DATA_SERVICE,
    TOKEN_CONSTANT.CONFIG_MIGRATION_SERVICE,
    ConfigMigrationService,
    ConfigMigrationRunnerService,
    CryptoUtility,
   ],
   imports: [...(properties.imports ?? [])],
   module: CrudConfigModule,
   providers: providers,
  };
 }

 private static createAsyncOptionsProvider(properties: ICrudConfigAsyncModuleProperties): Provider {
  if (properties.useFactory) {
   return {
    inject: properties.inject ?? [],
    provide: TOKEN_CONSTANT.CONFIG_OPTIONS,
    useFactory: properties.useFactory,
   };
  }

  const inject: Type<IConfigPropertiesFactory> | undefined =
   properties.useExisting ?? properties.useClass;

  return {
   inject: inject ? [inject] : [],
   provide: TOKEN_CONSTANT.CONFIG_OPTIONS,
   useFactory: async (optionsFactory: IConfigPropertiesFactory): Promise<IConfigOptions> => {
    return optionsFactory.createOptions();
   },
  };
 }
}
