import type { IApiBaseEntity } from "@elsikora/nestjs-crud-automator";

import { ConflictException } from "@nestjs/common";
import { DataSource, EntitySchema } from "typeorm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDynamicService } from "../../src/shared/utility";

class ConfigData implements IApiBaseEntity {
 environment!: string;

 id!: string;

 name!: string;

 section!: string;

 value!: string;
}

describe("ConfigData duplicate protection", () => {
 let dataSource: DataSource;

 beforeEach(async () => {
  const configDataSchema = new EntitySchema<ConfigData>({
   columns: {
    environment: { type: String },
    id: { generated: "uuid", primary: true, type: String },
    name: { type: String },
    section: { type: String },
    value: { type: String },
   },
   name: "ConfigData",
   tableName: "config_data_duplicate_test",
   target: ConfigData,
   uniques: [{ columns: ["name", "environment", "section"] }],
  });

  dataSource = new DataSource({
   database: new Uint8Array(),
   entities: [configDataSchema],
   synchronize: true,
   type: "sqljs",
  });

  await dataSource.initialize();
 });

 afterEach(async () => {
  await dataSource.destroy();
 });

 it("maps a real unique insert conflict without EventEmitter wiring", async () => {
  const DynamicConfigDataService = createDynamicService(ConfigData, "ConfigDataService");
  const service = new DynamicConfigDataService(dataSource.getRepository(ConfigData));
  const duplicate = {
   environment: "test",
   name: "API_KEY",
   section: "application",
   value: "first",
  };

  await service.create({ ...duplicate });

  let caughtError: unknown;

  try {
   await service.create({ ...duplicate, value: "second" });
  } catch (error: unknown) {
   caughtError = error;
  }

  expect(caughtError).toBeInstanceOf(ConflictException);
  expect((caughtError as ConflictException).getResponse()).toMatchObject({
   error: "Conflict",
   message: "CONFIGDATA_DUPLICATE_KEY",
   statusCode: 409,
  });
 });
});
