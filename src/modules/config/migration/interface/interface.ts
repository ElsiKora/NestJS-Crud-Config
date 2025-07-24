import type { EConfigMigrationStatus } from "../enum";

export interface IConfigMigration {
 createdAt: Date;
 executedAt?: Date;
 failedAt?: Date;
 id: string;
 name: string;
 startedAt?: Date;
 status: EConfigMigrationStatus;
 updatedAt: Date;
}
