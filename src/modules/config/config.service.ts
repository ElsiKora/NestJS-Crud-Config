import type { IConfigData } from "@modules/config/data";
import type { IConfigSection } from "@modules/config/section";
import type { IConfigOptions } from "@shared/interface/config";

import {
 ApiServiceBase,
 EErrorStringAction,
 ErrorString,
 IApiGetListResponseResult,
} from "@elsikora/nestjs-crud-automator";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import {
 HttpException,
 Inject,
 Injectable,
 InternalServerErrorException,
 Logger,
 NotFoundException,
 Optional,
} from "@nestjs/common";
import { TOKEN_CONSTANT } from "@shared/constant";
import { CryptoUtility } from "@shared/utility";
import { DataSource, EntityManager, QueryRunner } from "typeorm";

import {
 IConfigDeleteOptions,
 IConfigGetListOptions,
 IConfigGetOptions,
 IConfigSetOptions,
} from "./interface";

/**
 * Service for managing configuration data with caching support
 * Provides methods to retrieve configuration values with optional decryption
 */
@Injectable()
export class CrudConfigService {
 private readonly LOGGER: Logger = new Logger(CrudConfigService.name);

 constructor(
  @Inject(TOKEN_CONSTANT.CONFIG_SECTION_SERVICE)
  private readonly sectionService: ApiServiceBase<IConfigSection>,
  @Inject(TOKEN_CONSTANT.CONFIG_DATA_SERVICE)
  private readonly dataService: ApiServiceBase<IConfigData>,
  // @ts-ignore
  @Optional() @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  @Optional() @Inject(TOKEN_CONSTANT.CONFIG_OPTIONS) private readonly options?: IConfigOptions,
  private readonly dataSource?: DataSource,
  private readonly cryptoUtility?: CryptoUtility,
 ) {}

 /**
  * Deletes a configuration value
  * @param {IConfigDeleteOptions} options Configuration options to identify the value to delete
  * @returns {Promise<void>} Promise resolving when the configuration is deleted
  */
 async delete(options: IConfigDeleteOptions): Promise<void> {
  if (this.options?.isVerbose) {
   this.LOGGER.verbose(`Entering delete method with options: ${JSON.stringify(options)}`);
  }
  const { environment, eventManager, name, section: sectionName }: IConfigDeleteOptions = options;
  const finalEnvironment: string = environment ?? this.options?.environment ?? "default";

  try {
   const section: IConfigSection = await this.sectionService.get(
    { where: { name: sectionName } },
    eventManager,
   );

   const data: IConfigData = await this.dataService.get(
    {
     where: {
      environment: finalEnvironment,
      name,
      section: { id: section.id },
     },
    },
    eventManager,
   );

   await this.dataService.delete({ id: data.id }, eventManager);

   if (this.options?.cacheOptions?.isEnabled && this.cacheManager) {
    const cacheKey: string = `config:${sectionName}:${name}:${finalEnvironment}`;
    const listCacheKey: string = `config:list:${sectionName}:${finalEnvironment}`;

    await Promise.all([this.cacheManager.del(cacheKey), this.cacheManager.del(listCacheKey)]);
   }
  } catch (error: unknown) {
   if (this.options?.isVerbose) {
    this.LOGGER.error(`Error in delete method: ${(error as Error).message}`);
   }

   if (error instanceof HttpException) {
    throw error;
   }

   throw new InternalServerErrorException(
    ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.DELETING_ERROR }),
   );
  }
 }

 /**
  * Retrieves configuration data based on the provided options
  * @param {IConfigGetOptions} options Configuration retrieval options
  * @returns {Promise<IConfigData>} Promise resolving to the configuration data
  */
 async get(options: IConfigGetOptions): Promise<IConfigData> {
  if (this.options?.isVerbose) {
   this.LOGGER.verbose(`Entering get method with options: ${JSON.stringify(options)}`);
  }

  const {
   environment,
   eventManager,
   name,
   section,
   shouldLoadSectionInfo,
   useCache,
  }: IConfigGetOptions = options;
  const finalEnvironment: string = environment ?? this.options?.environment ?? "default";
  const cacheKey: string = `config:${section}:${name}:${finalEnvironment}`;

  try {
   // Check cache first if enabled
   if (useCache && this.options?.cacheOptions?.isEnabled && this.cacheManager) {
    const cachedData: IConfigData | undefined = await this.cacheManager.get<IConfigData>(cacheKey);

    if (cachedData) {
     if (this.options?.isVerbose) {
      this.LOGGER.verbose(`Returning cached config data for ${name}`);
     }

     return cachedData;
    }
   }

   // Fetch section
   if (this.options?.isVerbose) {
    this.LOGGER.verbose(`Fetching section: ${section}`);
   }

   const sectionData: IConfigSection = await this.sectionService.get(
    { where: { name: section } },
    eventManager,
   );

   if (this.options?.isVerbose) {
    this.LOGGER.verbose(`Fetching config data for name: ${name}, environment: ${finalEnvironment}`);
   }

   const data: IConfigData = await this.dataService.get(
    {
     // eslint-disable-next-line @elsikora/typescript/naming-convention
     relations: { section: shouldLoadSectionInfo },
     where: { environment: finalEnvironment, name, section: { id: sectionData.id } },
    },
    eventManager,
   );

   if (data.isEncrypted) {
    if (!this.options?.encryptionOptions?.encryptionKey) {
     throw new InternalServerErrorException(
      ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.KEY_NOT_FOUND }),
     );
    }

    if (!this.cryptoUtility) {
     throw new InternalServerErrorException("CryptoUtility not available");
    }

    try {
     data.value = this.cryptoUtility.decrypt(
      data.value,
      this.options.encryptionOptions.encryptionKey,
     );

     if (this.options?.isVerbose) {
      this.LOGGER.verbose(`Decrypted value for ${name}`);
     }
    } catch (error: unknown) {
     if (this.options?.isVerbose) {
      this.LOGGER.error(`Decryption error for ${name}: ${(error as Error).message}`);
     }

     throw new InternalServerErrorException(
      ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.DECRYPTION_ERROR }),
     );
    }
   }

   if (useCache && this.options?.cacheOptions?.isEnabled && this.cacheManager) {
    const ttl: number | undefined = this.options.cacheOptions.maxCacheTTL;
    await this.cacheManager.set(cacheKey, data, ttl);
   }

   if (this.options?.isVerbose) {
    this.LOGGER.verbose(`Returning config data for ${name}`);
   }

   return data;
  } catch (error: unknown) {
   if (this.options?.isVerbose) {
    this.LOGGER.error(`Error in get method: ${(error as Error).message}`);
   }

   if (error instanceof HttpException) {
    throw error;
   }

   throw new InternalServerErrorException(
    ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.FETCHING_ERROR }),
   );
  }
 }

 /**
  * Lists all configuration values in a section.
  * Supports caching and running within a TypeORM transaction.
  * @param {IConfigGetListOptions} options Options for listing configurations.
  * @returns {Promise<Array<IConfigData>>} Promise resolving to an array of configuration data.
  */
 async getList(options: IConfigGetListOptions): Promise<Array<IConfigData>> {
  if (this.options?.isVerbose) {
   this.LOGGER.verbose(`Entering getList method with options: ${JSON.stringify(options)}`);
  }

  const {
   environment,
   eventManager,
   section: sectionName,
   useCache,
  }: IConfigGetListOptions = options;
  const finalEnvironment: string = environment ?? this.options?.environment ?? "default";
  const cacheKey: string = `config:list:${sectionName}:${finalEnvironment}`;

  try {
   // Check cache first if enabled
   if (useCache && this.options?.cacheOptions?.isEnabled && this.cacheManager) {
    const cachedItems: Array<IConfigData> | undefined =
     await this.cacheManager.get<Array<IConfigData>>(cacheKey);

    if (cachedItems) {
     if (this.options?.isVerbose) {
      this.LOGGER.verbose(`Returning cached config list for ${sectionName}`);
     }

     return cachedItems;
    }
   }

   if (this.options?.isVerbose) {
    this.LOGGER.verbose(`Fetching section: ${sectionName}`);
   }

   const section: IConfigSection = await this.sectionService.get(
    { where: { name: sectionName } },
    eventManager,
   );

   if (this.options?.isVerbose) {
    this.LOGGER.verbose(
     `Fetching config list for section: ${sectionName}, environment: ${finalEnvironment}`,
    );
   }

   const result: IApiGetListResponseResult<IConfigData> = await this.dataService.getList(
    { where: { environment: finalEnvironment, section: { id: section.id } } },
    eventManager,
   );

   if (useCache && this.options?.cacheOptions?.isEnabled && this.cacheManager) {
    const ttl: number | undefined = this.options?.cacheOptions?.maxCacheTTL;
    await this.cacheManager.set(cacheKey, result.items, ttl);
   }

   if (this.options?.isVerbose) {
    this.LOGGER.verbose(`Returning ${result.items.length} config items`);
   }

   return result.items;
  } catch (error: unknown) {
   if (this.options?.isVerbose) {
    this.LOGGER.error(`Error in getList method: ${(error as Error).message}`);
   }

   if (error instanceof HttpException) {
    throw error;
   }

   throw new InternalServerErrorException(
    ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.FETCHING_LIST_ERROR }),
   );
  }
 }

 /**
  * Sets a configuration value with optional encryption.
  * The specified section must already exist.
  * If a configuration with the same name and environment already exists, it will be updated. Otherwise, a new one will be created.
  * @param {IConfigSetOptions} options Configuration set options
  * @returns {Promise<IConfigData>} Promise resolving to the saved configuration data
  */
 async set(options: IConfigSetOptions): Promise<IConfigData> {
  if (this.options?.isVerbose) {
   const maskedOptions: IConfigSetOptions = {
    ...options,
    value: "***",
   };
   this.LOGGER.verbose(`Entering set method with options: ${JSON.stringify(maskedOptions)}`);
  }

  const {
   description,
   environment,
   eventManager,
   name,
   section: sectionName,
   value,
  }: IConfigSetOptions = options;
  const finalEnvironment: string = environment ?? this.options?.environment ?? "default";

  const shouldApplyEncryption: boolean = this.options?.encryptionOptions?.isEnabled ?? false;
  let finalValue: string = value;
  let isEncrypted: boolean = false;

  if (shouldApplyEncryption) {
   if (!this.options?.encryptionOptions?.encryptionKey) {
    throw new InternalServerErrorException(
     ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.KEY_NOT_FOUND }),
    );
   }

   if (!this.cryptoUtility) {
    throw new InternalServerErrorException("CryptoUtility not available");
   }

   try {
    finalValue = this.cryptoUtility.encrypt(value, this.options.encryptionOptions.encryptionKey);
    isEncrypted = true;

    if (this.options?.isVerbose) {
     this.LOGGER.verbose(`Encrypted value for ${name}`);
    }
   } catch (error: unknown) {
    if (this.options?.isVerbose) {
     this.LOGGER.error(`Encryption error for ${name}: ${(error as Error).message}`);
    }

    throw new InternalServerErrorException(
     ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.ENCRYPTION_ERROR }),
    );
   }
  }

  let queryRunner: QueryRunner | undefined;
  let useTransaction: boolean = false;
  let localEventManager: EntityManager | undefined = eventManager;

  try {
   useTransaction = !eventManager;

   if (useTransaction) {
    if (!this.dataSource) {
     throw new InternalServerErrorException("DataSource not available for transaction");
    }
    queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    localEventManager = queryRunner.manager;
   }

   if (this.options?.isVerbose) {
    this.LOGGER.verbose(`Fetching or creating section: ${sectionName}`);
   }
   const section: IConfigSection = await this.getOrCreateSection(sectionName, localEventManager);

   if (this.options?.isVerbose) {
    this.LOGGER.verbose(`Preparing config data for ${name}`);
   }

   const configData: Partial<IConfigData> = {
    description: description ?? undefined,
    environment: finalEnvironment,
    isEncrypted,
    name,
    section: { id: section.id },
    value: finalValue,
   };

   let result: IConfigData;

   try {
    if (this.options?.isVerbose) {
     this.LOGGER.verbose(`Checking for existing config: ${name}`);
    }

    const existingData: IConfigData = await this.dataService.get(
     { where: { environment: finalEnvironment, name, section: { id: section.id } } },
     localEventManager,
    );

    if (this.options?.isVerbose) {
     this.LOGGER.verbose(`Updating existing config: ${name}`);
    }
    result = await this.dataService.update({ id: existingData.id }, configData, localEventManager);
   } catch (error: unknown) {
    if (error instanceof NotFoundException) {
     if (this.options?.isVerbose) {
      this.LOGGER.verbose(`Config ${name} not found, creating new one`);
     }
     result = await this.dataService.create(configData, localEventManager);
    } else {
     if (this.options?.isVerbose) {
      const errorMessage: string = error instanceof Error ? error.message : String(error);
      this.LOGGER.error(`Error updating config: ${errorMessage}`);
     }

     throw error;
    }
   }

   if (this.options?.cacheOptions?.isEnabled && this.cacheManager) {
    const cacheKey: string = `config:${sectionName}:${name}:${finalEnvironment}`;
    const listCacheKey: string = `config:list:${sectionName}:${finalEnvironment}`;

    await Promise.all([this.cacheManager.del(cacheKey), this.cacheManager.del(listCacheKey)]);
   }

   if (useTransaction && queryRunner) {
    await queryRunner.commitTransaction();
    await queryRunner.release();
   }

   if (this.options?.isVerbose) {
    this.LOGGER.verbose(`Set method completed successfully for ${name}`);
   }

   return result;
  } catch (error: unknown) {
   if (useTransaction && queryRunner) {
    await queryRunner.rollbackTransaction();
    await queryRunner.release();
   }

   if (this.options?.isVerbose) {
    const errorMessage: string = error instanceof Error ? error.message : String(error);
    this.LOGGER.error(`Error in set method: ${errorMessage}`);
   }

   if (error instanceof HttpException) {
    throw error;
   }

   throw new InternalServerErrorException(
    ErrorString({ entity: { name: "ConfigData" }, type: EErrorStringAction.CREATING_ERROR }),
   );
  }
 }

 private async getOrCreateSection(
  sectionName: string,
  eventManager?: EntityManager,
 ): Promise<IConfigSection> {
  try {
   return await this.sectionService.get({ where: { name: sectionName } }, eventManager);
  } catch (error: unknown) {
   if (error instanceof NotFoundException && this.options?.shouldAutoCreateSections) {
    if (this.options?.isVerbose) {
     this.LOGGER.verbose(`Section ${sectionName} not found, creating new one`);
    }

    return await this.sectionService.create({ name: sectionName }, eventManager);
   } else {
    if (this.options?.isVerbose) {
     const errorMessage: string = error instanceof Error ? error.message : String(error);
     this.LOGGER.error(`Error fetching section: ${errorMessage}`);
    }

    throw error;
   }
  }
 }
}
