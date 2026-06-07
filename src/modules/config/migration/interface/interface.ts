import type { IApiBaseEntity } from "@elsikora/nestjs-crud-automator";

import type { EConfigMigrationStatus } from "../enum";

export interface IConfigMigration extends IApiBaseEntity {
 createdAt: Date;
 executedAt?: Date;
 failedAt?: Date;
 id: string;
 name: string;
 startedAt?: Date;
 status: EConfigMigrationStatus;
 updatedAt: Date;
}
