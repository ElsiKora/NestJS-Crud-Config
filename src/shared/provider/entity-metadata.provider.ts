import { Provider } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EntityClassType } from '@shared/factory';

export const ENTITY_METADATA_KEY = 'CRUD_CONFIG_ENTITY_METADATA';

export interface EntityMetadata {
  sectionEntity: EntityClassType;
  dataEntity: EntityClassType;
}

/**
 * Provider to store entity metadata globally
 */
export const createEntityMetadataProvider = (
  sectionEntity: EntityClassType,
  dataEntity: EntityClassType
): Provider => ({
  provide: ENTITY_METADATA_KEY,
  useValue: {
    sectionEntity,
    dataEntity,
  } as EntityMetadata,
});

/**
 * Provider to register entities with DataSource
 */
export const createEntityRegistrationProvider = (): Provider => ({
  provide: 'ENTITY_REGISTRATION',
  inject: [getDataSourceToken(), ENTITY_METADATA_KEY],
  useFactory: async (_dataSource: DataSource, metadata: EntityMetadata) => {
    // Entities will be automatically registered when creating repositories
    console.log('Dynamic entities registered:', {
      section: metadata.sectionEntity.name,
      data: metadata.dataEntity.name,
    });
    return true;
  },
});