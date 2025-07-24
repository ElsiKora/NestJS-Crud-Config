import type { IConfigOptions } from "@shared/interface/config";

import type { IConfigMigration, IConfigMigrationOptions } from "./interface";

import { ConsoleLogger, Inject, Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { TOKEN_CONSTANT } from "@shared/constant";
import { CONFIG_MIGRATION_CONSTANT } from "@shared/constant/config";
import { LoggerUtility } from "@shared/utility";

import { EConfigMigrationStatus } from "./enum";
import { ConfigMigrationService } from "./migration.service";

/**
 * Service that runs migrations on application startup
 */
@Injectable()
export class ConfigMigrationRunnerService implements OnApplicationBootstrap {
 private readonly LOGGER: ConsoleLogger = LoggerUtility.getLogger("ConfigMigrationRunnerService");

 constructor(
  private readonly migrationService: ConfigMigrationService,
  @Inject(TOKEN_CONSTANT.CONFIG_OPTIONS)
  private readonly options: IConfigOptions,
 ) {}

 /**
  * Called when the application is fully bootstrapped
  * Runs migrations if enabled and configured to run on startup
  */
 async onApplicationBootstrap(): Promise<void> {
  const migrationOptions: IConfigMigrationOptions | undefined = this.options.migrationOptions;

  if (!migrationOptions?.isEnabled) {
   this.LOGGER.verbose("Migrations are disabled");

   return;
  }

  if (!migrationOptions.shouldRunOnStartup) {
   this.LOGGER.verbose("Migrations configured to not run on startup");

   return;
  }

  if (!migrationOptions.migrations || migrationOptions.migrations.length === 0) {
   this.LOGGER.verbose("No migrations configured");

   return;
  }

  try {
   this.LOGGER.verbose("Starting migration runner");

   // Check for failed and stuck migrations from previous runs
   const allMigrations: Array<IConfigMigration> =
    await this.migrationService.getExecutedMigrations();

   const failedMigrations: Array<IConfigMigration> = allMigrations.filter(
    (m: IConfigMigration) => m.status === EConfigMigrationStatus.FAILED,
   );

   if (failedMigrations.length > 0) {
    this.LOGGER.warn(
     `Found ${failedMigrations.length} failed migration(s) from previous runs: ${failedMigrations.map((m: IConfigMigration) => m.name).join(", ")}`,
    );
    this.LOGGER.warn("Consider reviewing and cleaning up failed migrations before proceeding");
   }

   // Clean up stuck migrations with configured timeout
   const timeoutMinutes: number =
    migrationOptions.stuckMigrationTimeoutMinutes ??
    CONFIG_MIGRATION_CONSTANT.DEFAULT_STUCK_MIGRATION_TIMEOUT_MINUTES;
   await this.migrationService.cleanupStuckMigrations(timeoutMinutes);

   await this.migrationService.executeMigrations(
    migrationOptions.migrations,
    migrationOptions.useTransaction ?? true,
   );

   this.LOGGER.verbose("Migration runner completed successfully");
  } catch (error) {
   this.LOGGER.error("Migration runner failed:", error);

   throw error;
  }
 }

 /**
  * Manually run migrations (for testing or manual execution)
  * @returns {Promise<void>} Promise that resolves when migrations are complete
  */
 async runMigrations(): Promise<void> {
  const migrationOptions: IConfigMigrationOptions | undefined = this.options.migrationOptions;

  if (!migrationOptions?.isEnabled) {
   throw new Error("Migrations are not enabled");
  }

  if (!migrationOptions.migrations || migrationOptions.migrations.length === 0) {
   throw new Error("No migrations configured");
  }

  await this.migrationService.executeMigrations(
   migrationOptions.migrations,
   migrationOptions.useTransaction ?? true,
  );
 }
}
