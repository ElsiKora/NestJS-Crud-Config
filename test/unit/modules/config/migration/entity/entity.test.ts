import { describe, expect, it } from "vitest";
import { createConfigMigrationEntity } from "../../../../../../src/modules/config/migration/entity";
import { CONFIG_MIGRATION_CONSTANT } from "../../../../../../src/shared/constant";
import { getMetadataArgsStorage, type ColumnType } from "typeorm";

const TEMPORAL_COLUMN_DECORATOR_COUNTS: Record<string, number> = {
 createdAt: 2,
 executedAt: 1,
 failedAt: 1,
 startedAt: 1,
 updatedAt: 2,
};

function expectTimestampMetadata(entity: Function, expectedType: ColumnType): void {
 for (const [propertyName, expectedCount] of Object.entries(TEMPORAL_COLUMN_DECORATOR_COUNTS)) {
  const columns = getMetadataArgsStorage().columns.filter(
   (metadata) => metadata.target === entity && metadata.propertyName === propertyName,
  );

  expect(columns).toHaveLength(expectedCount);
  expect(columns.every((column) => column.options.type === expectedType)).toBe(true);
 }
}

describe("createConfigMigrationEntity", () => {
 it("should default every temporal column and date decorator to timestamp", () => {
  const ConfigMigrationEntity = createConfigMigrationEntity({
   maxNameLength: CONFIG_MIGRATION_CONSTANT.MAX_NAME_LENGTH,
   tableName: CONFIG_MIGRATION_CONSTANT.DEFAULT_TABLE_NAME,
  });

  expectTimestampMetadata(ConfigMigrationEntity, "timestamp");
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
