import type { ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import type { IConfigOptions } from "@shared/interface/config";

import type { IConfigMigration, IConfigMigrationDefinition } from "./interface";

import { CrudConfigService } from "@modules/config/config.service";
import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { CONFIG_MIGRATION_CONSTANT, TOKEN_CONSTANT } from "@shared/constant";
import { DataSource, type EntityManager } from "typeorm";

import { EConfigMigrationStatus } from "./enum";

@Injectable()
export class ConfigMigrationService implements OnModuleInit {
 private readonly LOGGER: Logger = new Logger(ConfigMigrationService.name);

 private readonly MIGRATION_SERVICE: ApiServiceBase<IConfigMigration>;

 constructor(
  @Inject(DataSource) private readonly dataSource: DataSource,
  @Inject(TOKEN_CONSTANT.CONFIG_OPTIONS) private readonly options: IConfigOptions,
  private readonly configService: CrudConfigService,
  @Inject(TOKEN_CONSTANT.CONFIG_MIGRATION_SERVICE)
  migrationService: ApiServiceBase<IConfigMigration>,
 ) {
  this.MIGRATION_SERVICE = migrationService;
 }

 /**
  * Cleans up failed migrations
  * @param {string} [migrationName] - Optional migration name to clean up
  * @returns {Promise<void>} Promise that resolves when cleanup is complete
  */
 async cleanupFailedMigrations(migrationName?: string): Promise<void> {
  try {
   const whereCondition: { name?: string; status: EConfigMigrationStatus } = migrationName
    ? { name: migrationName, status: EConfigMigrationStatus.FAILED }
    : { status: EConfigMigrationStatus.FAILED };

   // Use bulk delete operation to avoid N+1 problem
   const result: { count: number; items: Array<IConfigMigration> } =
    await this.MIGRATION_SERVICE.getList({ where: whereCondition });

   if (result.items.length === 0) {
    this.LOGGER.verbose("No failed migrations found to clean up");

    return;
   }

   // Delete all failed migrations in bulk
   const migrationIds: Array<string> = result.items.map((m: IConfigMigration) => m.id);

   for (const id of migrationIds) {
    await this.MIGRATION_SERVICE.delete({ id });
   }

   this.LOGGER.verbose(
    `Cleaned up ${result.items.length} failed migration(s): ${result.items.map((m: IConfigMigration) => m.name).join(", ")}`,
   );
  } catch (error) {
   this.LOGGER.error("Failed to cleanup failed migrations:", error);

   throw error;
  }
 }

 /**
  * Cleans up stuck migrations (running for too long)
  * @param {number} [timeoutMinutes] - Minutes after which a RUNNING migration is considered stuck
  * @returns {Promise<void>} Promise that resolves when cleanup is complete
  */
 async cleanupStuckMigrations(
  timeoutMinutes: number = CONFIG_MIGRATION_CONSTANT.DEFAULT_STUCK_MIGRATION_TIMEOUT_MINUTES,
 ): Promise<void> {
  try {
   const cutoffTime: Date = new Date();
   cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

   const runningMigrations: { count: number; items: Array<IConfigMigration> } =
    await this.MIGRATION_SERVICE.getList({
     where: { status: EConfigMigrationStatus.RUNNING },
    });

   const stuckMigrations: Array<IConfigMigration> = runningMigrations.items.filter(
    (migration: IConfigMigration) => {
     return migration.startedAt && new Date(migration.startedAt) < cutoffTime;
    },
   );

   if (stuckMigrations.length === 0) {
    this.LOGGER.verbose("No stuck migrations found");

    return;
   }

   this.LOGGER.warn(
    `Found ${stuckMigrations.length} stuck migration(s): ${stuckMigrations.map((m: IConfigMigration) => m.name).join(", ")}`,
   );

   // Mark stuck migrations as STUCK status
   for (const migration of stuckMigrations) {
    await this.MIGRATION_SERVICE.update(
     { id: migration.id },
     {
      failedAt: new Date(),
      status: EConfigMigrationStatus.STUCK,
     },
    );

    this.LOGGER.verbose(`Marked migration as stuck: ${migration.name}`);
   }

   this.LOGGER.warn(
    `Marked ${stuckMigrations.length} migration(s) as stuck. You may need to investigate and clean them up manually.`,
   );
  } catch (error) {
   this.LOGGER.error("Failed to cleanup stuck migrations:", error);

   throw error;
  }
 }

 /**
  * Executes pending migrations
  * @param {Array<IConfigMigrationDefinition>} migrations - Array of migration definitions
  * @param {boolean} [useTransaction] - Whether to run migrations in a transaction
  * @returns {Promise<void>} Promise that resolves when all migrations are executed
  */
 async executeMigrations(
  migrations: Array<IConfigMigrationDefinition>,
  useTransaction: boolean = true,
 ): Promise<void> {
  if (!migrations || migrations.length === 0) {
   this.LOGGER.verbose("No migrations to execute");

   return;
  }

  // Validate migrations
  this.validateMigrations(migrations);

  // Sort migrations by name to ensure consistent order
  const sortedMigrations: Array<IConfigMigrationDefinition> = [...migrations].sort(
   (a: IConfigMigrationDefinition, b: IConfigMigrationDefinition) => a.name.localeCompare(b.name),
  );

  this.LOGGER.verbose(`Starting migration execution for ${sortedMigrations.length} migrations`);

  // Clean up stuck migrations before starting new ones
  const timeoutMinutes: number =
   this.options.migrationOptions?.stuckMigrationTimeoutMinutes ??
   CONFIG_MIGRATION_CONSTANT.DEFAULT_STUCK_MIGRATION_TIMEOUT_MINUTES;
  await this.cleanupStuckMigrations(timeoutMinutes);

  const executedMigrations: Array<IConfigMigration> = await this.getExecutedMigrations();

  const completedMigrationNames: Set<string> = new Set<string>(
   executedMigrations
    .filter((m: IConfigMigration) => m.status === EConfigMigrationStatus.COMPLETED)
    .map((m: IConfigMigration) => m.name),
  );

  // Also check for currently running migrations to avoid conflicts
  const runningMigrationNames: Set<string> = new Set<string>(
   executedMigrations
    .filter((m: IConfigMigration) => m.status === EConfigMigrationStatus.RUNNING)
    .map((m: IConfigMigration) => m.name),
  );

  const pendingMigrations: Array<IConfigMigrationDefinition> = sortedMigrations.filter(
   (migration: IConfigMigrationDefinition) =>
    !completedMigrationNames.has(migration.name) && !runningMigrationNames.has(migration.name),
  );

  if (pendingMigrations.length === 0) {
   this.LOGGER.verbose("No pending migrations to execute");

   return;
  }

  this.LOGGER.verbose(
   `Found ${pendingMigrations.length} pending migration(s): ${pendingMigrations.map((m: IConfigMigrationDefinition) => m.name).join(", ")}`,
  );

  if (useTransaction) {
   await this.dataSource.transaction(async (transactionalEntityManager: EntityManager) => {
    for (const migration of pendingMigrations) {
     await this.executeSingleMigration(migration, transactionalEntityManager);
    }
   });
  } else {
   for (const migration of pendingMigrations) {
    await this.executeSingleMigration(migration);
   }
  }

  this.LOGGER.verbose(
   `Successfully executed ${pendingMigrations.length} migration(s): ${pendingMigrations.map((m: IConfigMigrationDefinition) => m.name).join(", ")}`,
  );
 }

 /**
  * Gets list of executed migration names
  * @returns {Promise<string[]>} Promise that resolves to list of executed migration names
  */
 async getExecutedMigrationList(): Promise<Array<string>> {
  const executedMigrations: Array<IConfigMigration> = await this.getExecutedMigrations();

  return executedMigrations.map((migration: IConfigMigration) => migration.name);
 }

 /**
  * Gets list of executed migrations
  * @returns {Promise<IConfigMigration[]>} Promise that resolves to list of executed migrations
  */
 async getExecutedMigrations(): Promise<Array<IConfigMigration>> {
  try {
   const result: { count: number; items: Array<IConfigMigration> } =
    await this.MIGRATION_SERVICE.getList({
     order: { name: "ASC" },
    });

   return result.items;
  } catch (error) {
   const errorMessage: string = `Failed to get executed migrations: ${error instanceof Error ? error.message : String(error)}`;

   this.LOGGER.error(errorMessage);

   throw error;
  }
 }

 /**
  * Checks if a migration has been executed
  * @param {string} migrationName - The name of the migration to check
  * @returns {Promise<boolean>} Promise that resolves to true if migration is executed
  */
 async isMigrationExecuted(migrationName: string): Promise<boolean> {
  try {
   const result: { count: number; items: Array<IConfigMigration> } =
    await this.MIGRATION_SERVICE.getList({
     where: { name: migrationName },
    });

   return result.items.length > 0 && result.items[0]?.status === EConfigMigrationStatus.COMPLETED;
  } catch (error) {
   this.LOGGER.error(`Failed to check if migration '${migrationName}' is executed:`, error);

   throw error;
  }
 }

 onModuleInit(): void {
  // Remove the dynamic entity creation - we already have the service injected
  this.LOGGER.log("Migration service initialized");
 }

 /**
  * Rolls back a migration
  * @param {string} migrationName - The name of the migration to roll back
  * @param {Array<IConfigMigrationDefinition>} migrations - Array of migration definitions
  * @returns {Promise<void>} Promise that resolves when rollback is complete
  */
 async rollbackMigration(
  migrationName: string,
  migrations: Array<IConfigMigrationDefinition>,
 ): Promise<void> {
  const migration: IConfigMigrationDefinition | undefined = migrations.find(
   (m: IConfigMigrationDefinition) => m.name === migrationName,
  );

  if (!migration) {
   throw new Error(`Migration '${migrationName}' not found`);
  }

  if (!migration.down) {
   throw new Error(`Migration '${migrationName}' does not have a down method`);
  }

  const startTime: Date = new Date();

  try {
   this.LOGGER.verbose(`Starting rollback for migration: ${migration.name}`);

   await this.dataSource.transaction(async (transactionalEntityManager: EntityManager) => {
    try {
     // Execute the down method
     if (migration.down) {
      await migration.down(this.configService, transactionalEntityManager);
     }

     // Delete the migration record
     await this.MIGRATION_SERVICE.delete({ name: migrationName });

     this.LOGGER.verbose(`Successfully rolled back migration: ${migration.name}`);
    } catch (downError) {
     const errorMessage: string = `Failed to rollback migration '${migration.name}': ${downError instanceof Error ? downError.message : String(downError)}`;

     this.LOGGER.error(errorMessage);

     // Don't update the migration record on rollback failure
     throw downError;
    }
   });

   const completedTime: Date = new Date();

   this.LOGGER.verbose(
    `Migration rollback completed: ${migration.name} (took ${completedTime.getTime() - startTime.getTime()}ms)`,
   );
  } catch (error) {
   const duration: number = Date.now() - startTime.getTime();

   this.LOGGER.error(`Migration rollback failed: ${migration.name} (took ${duration}ms)`, error);

   const failedTime: Date = new Date();

   // Update migration status to FAILED
   await this.MIGRATION_SERVICE.update(
    { name: migrationName },
    {
     failedAt: failedTime,
     status: EConfigMigrationStatus.FAILED,
    },
   );

   throw error;
  }
 }

 /**
  * Executes a single migration
  * @param {IConfigMigrationDefinition} migration - Migration definition
  * @param {EntityManager} [transactionalEntityManager] - Optional transaction manager
  * @returns {Promise<void>} Promise that resolves when migration is executed
  */
 private async executeSingleMigration(
  migration: IConfigMigrationDefinition,
  transactionalEntityManager?: EntityManager,
 ): Promise<void> {
  this.LOGGER.verbose(`Executing migration: ${migration.name}`);

  // First, record the migration as started (to prevent race conditions)
  let migrationRecord: IConfigMigration;
  const startTime: Date = new Date();

  try {
   migrationRecord = await this.MIGRATION_SERVICE.create(
    {
     name: migration.name,
     startedAt: startTime,
     status: EConfigMigrationStatus.RUNNING,
    },
    transactionalEntityManager,
   );
  } catch (error) {
   // If creation fails due to unique constraint violation, migration might already be running
   const errorMessage: string = error instanceof Error ? error.message : String(error);

   if (
    errorMessage.includes("duplicate") ||
    errorMessage.includes("unique") ||
    errorMessage.includes("UNIQUE")
   ) {
    this.LOGGER.warn(`Migration '${migration.name}' is already running or has been executed`);

    return;
   }

   throw error;
  }

  try {
   // Execute the migration
   await migration.up(this.configService, transactionalEntityManager);

   // Update status to completed with executedAt timestamp
   const completedTime: Date = new Date();
   await this.MIGRATION_SERVICE.update(
    { id: migrationRecord.id },
    {
     executedAt: completedTime,
     status: EConfigMigrationStatus.COMPLETED,
    },
    transactionalEntityManager,
   );

   const duration: number = completedTime.getTime() - startTime.getTime();
   this.LOGGER.verbose(`Successfully executed migration: ${migration.name} (${duration}ms)`);
  } catch (error) {
   this.LOGGER.error(`Failed to execute migration: ${migration.name}`, error);

   // Mark migration as failed with failedAt timestamp
   const failedTime: Date = new Date();

   try {
    await this.MIGRATION_SERVICE.update(
     { id: migrationRecord.id },
     {
      failedAt: failedTime,
      status: EConfigMigrationStatus.FAILED,
     },
     transactionalEntityManager,
    );
   } catch (updateError) {
    this.LOGGER.error(`Failed to update migration status for ${migration.name}:`, updateError);
   }

   throw error;
  }
 }

 /**
  * Validates migrations for duplicates and naming issues
  * @param {Array<IConfigMigrationDefinition>} migrations - Array of migration definitions
  */
 private validateMigrations(migrations: Array<IConfigMigrationDefinition>): void {
  // Check for duplicate names
  const migrationNames: Array<string> = migrations.map((m: IConfigMigrationDefinition) => m.name);

  const duplicates: Array<string> = migrationNames.filter(
   (name: string, index: number) => migrationNames.indexOf(name) !== index,
  );

  if (duplicates.length > 0) {
   throw new Error(`Duplicate migration names found: ${duplicates.join(", ")}`);
  }

  // Check for invalid names (cannot be empty or contain only whitespace)
  const invalidNames: Array<string> = migrationNames.filter((name: string) => !name?.trim());

  if (invalidNames.length > 0) {
   throw new Error("Migration names cannot be empty or contain only whitespace");
  }

  // Check for missing required methods
  const invalidMigrations: Array<IConfigMigrationDefinition> = migrations.filter(
   (m: IConfigMigrationDefinition) => !m.up || typeof m.up !== "function",
  );

  if (invalidMigrations.length > 0) {
   throw new Error(
    `Migrations missing required 'up' method: ${invalidMigrations.map((m: IConfigMigrationDefinition) => m.name).join(", ")}`,
   );
  }

  // Check for names that are too long
  const tooLongNames: Array<string> = migrationNames.filter(
   (name: string) => name.length > CONFIG_MIGRATION_CONSTANT.MAX_NAME_LENGTH,
  );

  if (tooLongNames.length > 0) {
   throw new Error(
    `Migration names too long (max ${CONFIG_MIGRATION_CONSTANT.MAX_NAME_LENGTH} characters): ${tooLongNames.join(", ")}`,
   );
  }
 }
}
