import { describe, expect, it } from "vitest";
import { createConfigMigrationEntity } from "../../../../../../src/modules/config/migration/entity";
import { CONFIG_MIGRATION_CONSTANT } from "../../../../../../src/shared/constant";
import { getMetadataArgsStorage, type ColumnType } from "typeorm";

// One column per property; createdAt and updatedAt are in TypeORM's create and update date modes
const TEMPORAL_COLUMN_MODES: Record<string, string> = {
 createdAt: "createDate",
 executedAt: "regular",
 failedAt: "regular",
 startedAt: "regular",
 updatedAt: "updateDate",
};

function expectTimestampMetadata(entity: Function, expectedType: ColumnType): void {
 for (const [propertyName, expectedMode] of Object.entries(TEMPORAL_COLUMN_MODES)) {
  const columns = getMetadataArgsStorage().columns.filter(
   (metadata) => metadata.target === entity && metadata.propertyName === propertyName,
  );

  expect(columns.map((column) => [column.mode, column.options.type])).toEqual([
   [expectedMode, expectedType],
  ]);
 }
}

describe("createConfigMigrationEntity", () => {
 it("should default every temporal column and date decorator to the driver-portable Date type", () => {
  const ConfigMigrationEntity = createConfigMigrationEntity({
   maxNameLength: CONFIG_MIGRATION_CONSTANT.MAX_NAME_LENGTH,
   tableName: CONFIG_MIGRATION_CONSTANT.DEFAULT_TABLE_NAME,
  });

  expectTimestampMetadata(ConfigMigrationEntity, Date);
 });

 it("should use a custom timestamp column type for every temporal column and date decorator", () => {
  const ConfigMigrationEntity = createConfigMigrationEntity({
   maxNameLength: CONFIG_MIGRATION_CONSTANT.MAX_NAME_LENGTH,
   tableName: CONFIG_MIGRATION_CONSTANT.DEFAULT_TABLE_NAME,
   timestampColumnType: "datetime",
  });

  expectTimestampMetadata(ConfigMigrationEntity, "datetime");
 });
});

describe("createConfigMigrationEntity status column", () => {
 it("should store the status as a simple-enum, which every TypeORM driver supports", () => {
  const ConfigMigrationEntity = createConfigMigrationEntity({
   maxNameLength: CONFIG_MIGRATION_CONSTANT.MAX_NAME_LENGTH,
   tableName: CONFIG_MIGRATION_CONSTANT.DEFAULT_TABLE_NAME,
  });
  const [status] = getMetadataArgsStorage().columns.filter(
   (metadata) => metadata.target === ConfigMigrationEntity && metadata.propertyName === "status",
  );

  expect(status?.options.type).toBe("simple-enum");
  expect(status?.options.enum).toEqual(["PENDING", "RUNNING", "COMPLETED", "FAILED", "STUCK"]);
 });
});
