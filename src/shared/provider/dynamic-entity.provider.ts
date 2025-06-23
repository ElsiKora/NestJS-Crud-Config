import { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createConfigSectionEntity, createConfigDataEntity, EntityClassType } from '@shared/factory';
import { ICrudConfigProperties } from '@shared/interface/config';

export const CONFIG_SECTION_ENTITY = 'CONFIG_SECTION_ENTITY';
export const CONFIG_DATA_ENTITY = 'CONFIG_DATA_ENTITY';
export const CONFIG_SECTION_REPOSITORY = 'CONFIG_SECTION_REPOSITORY';
export const CONFIG_DATA_REPOSITORY = 'CONFIG_DATA_REPOSITORY';

/**
 * Creates providers for dynamic entities
 */
export function createDynamicEntityProviders(options: ICrudConfigProperties): Provider[] {
  const prefix = options.entityOptions?.tablePrefix || '';
  
  // Default configurations
  const sectionConfig = {
    tableName: prefix + (options.entityOptions?.configSection?.tableName || 'config_section'),
    maxNameLength: options.entityOptions?.configSection?.maxNameLength || 128,
    maxDescriptionLength: options.entityOptions?.configSection?.maxDescriptionLength || 512,
  };

  const dataConfig = {
    tableName: prefix + (options.entityOptions?.configData?.tableName || 'config_data'),
    maxNameLength: options.entityOptions?.configData?.maxNameLength || 128,
    maxValueLength: options.entityOptions?.configData?.maxValueLength || 8192,
    maxEnvironmentLength: options.entityOptions?.configData?.maxEnvironmentLength || 64,
    maxDescriptionLength: options.entityOptions?.configData?.maxDescriptionLength || 512,
  };

  return [
    // Provide dynamic entity classes
    {
      provide: CONFIG_SECTION_ENTITY,
      useFactory: () => {
        return createConfigSectionEntity(sectionConfig);
      },
    },
    {
      provide: CONFIG_DATA_ENTITY,
      inject: [CONFIG_SECTION_ENTITY],
      useFactory: (configSectionEntity: EntityClassType) => {
        return createConfigDataEntity({
          ...dataConfig,
          configSectionEntity,
        });
      },
    },
    // Provide repositories for dynamic entities
    {
      provide: CONFIG_SECTION_REPOSITORY,
      inject: [getDataSourceToken(), CONFIG_SECTION_ENTITY],
      useFactory: (dataSource: DataSource, entity: EntityClassType) => {
        // Get repository for the dynamic entity
        return dataSource.getRepository(entity);
      },
    },
    {
      provide: CONFIG_DATA_REPOSITORY,
      inject: [getDataSourceToken(), CONFIG_DATA_ENTITY],
      useFactory: (dataSource: DataSource, entity: EntityClassType) => {
        // Get repository for the dynamic entity
        return dataSource.getRepository(entity);
      },
    },
  ];
}

/**
 * Helper to get repository tokens for dynamic entities
 */
export const DYNAMIC_REPOSITORIES = {
  CONFIG_SECTION: CONFIG_SECTION_REPOSITORY,
  CONFIG_DATA: CONFIG_DATA_REPOSITORY,
} as const;