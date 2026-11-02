import { randomBytes } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

import { ApiAuthorizationModule, EApiRouteType } from "@elsikora/nestjs-crud-automator";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, type TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSource, type ObjectLiteral } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { IConfigData, IConfigSection, TDynamicEntity } from "../../src/index";
import { BUILT_PACKAGE } from "./built-package";

const { CrudConfigModule, CrudConfigService, TOKEN_CONSTANT } = BUILT_PACKAGE;

interface IDatabase {
 options: TypeOrmModuleOptions;
 stop: () => Promise<void>;
}

/**
 * Creates an empty Postgres database: on DATABASE_URL when set, otherwise in a testcontainers Postgres.
 * @returns {Promise<IDatabase>} The connection options and a callback that removes the database.
 */
async function createPostgresDatabase(): Promise<IDatabase> {
 let serverUrl: string | undefined = process.env.DATABASE_URL;
 let stopContainer: () => Promise<void> = async () => {};

 if (!serverUrl) {
  const { PostgreSqlContainer } = await import("@testcontainers/postgresql");
  const container = await new PostgreSqlContainer("postgres:17-alpine").start();

  serverUrl = container.getConnectionUri();
  stopContainer = async () => void (await container.stop());
 }

 const admin: DataSource = new DataSource({ type: "postgres", url: serverUrl });
 const name: string = `crud_config_dates_${randomBytes(4).toString("hex")}`;
 const url: URL = new URL(serverUrl);

 await admin.initialize();
 await admin.query(`CREATE DATABASE "${name}"`);
 url.pathname = `/${name}`;

 return {
  options: { type: "postgres", url: url.toString() },
  stop: async () => {
   await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
   await admin.destroy();
   await stopContainer();
  },
 };
}

const DRIVERS: Array<{ create: () => Promise<IDatabase>; type: string }> = [
 {
  create: async () => ({
   options: { database: ":memory:", type: "better-sqlite3" },
   stop: async () => {},
  }),
  type: "better-sqlite3",
 },
 { create: createPostgresDatabase, type: "postgres" },
];

// SQLite stores CURRENT_TIMESTAMP with second precision, so updates wait past the next second
const UPDATE_DELAY_MS: number = 1100;

describe.each(DRIVERS)("CrudConfig date columns on $type", ({ create }) => {
 let app: NestFastifyApplication;
 let database: IDatabase;
 let dataSource: DataSource;
 let entities: { data: TDynamicEntity; migration: TDynamicEntity; section: TDynamicEntity };

 beforeAll(async () => {
  database = await create();
  const moduleRef = await Test.createTestingModule({
   imports: [
    // Generated routes run ApiAuthorizationGuard, whose runtime this global module provides
    ApiAuthorizationModule,
    CrudConfigModule.register({
     controllersOptions: {
      data: { isEnabled: true, properties: { path: "config/data" } },
      section: {
       isEnabled: true,
       properties: {
        path: "config/sections",
        routes: { [EApiRouteType.PARTIAL_UPDATE]: { generation: { isEnabled: true } } },
       },
      },
     },
     environment: "test",
     shouldAutoCreateSections: true,
    }),
    TypeOrmModule.forRootAsync({
     imports: [CrudConfigModule],
     inject: [
      TOKEN_CONSTANT.CONFIG_SECTION_ENTITY,
      TOKEN_CONSTANT.CONFIG_DATA_ENTITY,
      TOKEN_CONSTANT.CONFIG_MIGRATION_ENTITY,
     ],
     useFactory: (
      section: TDynamicEntity,
      data: TDynamicEntity,
      migration: TDynamicEntity,
     ): TypeOrmModuleOptions => {
      entities = { data, migration, section };

      return {
       ...database.options,
       entities: [section, data, migration],
       logging: false,
       retryAttempts: 0,
       synchronize: true,
      } as TypeOrmModuleOptions;
     },
    }),
   ],
  }).compile();

  app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), {
   logger: false,
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  dataSource = app.get(DataSource);
 }, 120_000);

 afterAll(async () => {
  await app?.close();
  await database?.stop();
 }, 60_000);

 it("maps createdAt and updatedAt of every entity to TypeORM create and update date columns", () => {
  for (const entity of Object.values(entities)) {
   const metadata = dataSource.getMetadata(entity);

   expect(metadata.findColumnWithPropertyName("createdAt")?.isCreateDate, metadata.name).toBe(true);
   expect(metadata.findColumnWithPropertyName("updatedAt")?.isUpdateDate, metadata.name).toBe(true);
  }
 });

 it("sets createdAt on insert and moves only updatedAt when the generated update route saves", async () => {
  const created = await app.inject({
   method: "POST",
   payload: { description: "created", name: "dates" },
   url: "/config/sections",
  });

  expect(created.statusCode, created.body).toBe(201);
  const { id } = created.json<{ id: string }>();
  const inserted: IConfigSection = await dataSource
   .getRepository<IConfigSection & ObjectLiteral>(entities.section)
   .findOneByOrFail({ id });

  expect(inserted.createdAt).toBeInstanceOf(Date);
  expect(inserted.updatedAt).toBeInstanceOf(Date);

  await sleep(UPDATE_DELAY_MS);
  const updated = await app.inject({
   method: "PUT",
   payload: { description: "updated", name: "dates" },
   url: `/config/sections/${id}`,
  });

  expect(updated.statusCode, updated.body).toBe(200);
  const saved: IConfigSection = await dataSource
   .getRepository<IConfigSection & ObjectLiteral>(entities.section)
   .findOneByOrFail({ id });

  expect(saved.description).toBe("updated");
  expect(saved.createdAt.getTime()).toBe(inserted.createdAt.getTime());
  expect(saved.updatedAt.getTime()).toBeGreaterThan(inserted.updatedAt.getTime());
 });

 it("moves only updatedAt when the generated partial update route saves", async () => {
  const created = await app.inject({
   method: "POST",
   payload: { description: "created", name: "dates-patch" },
   url: "/config/sections",
  });

  expect(created.statusCode, created.body).toBe(201);
  const { id } = created.json<{ id: string }>();
  const inserted: IConfigSection = await dataSource
   .getRepository<IConfigSection & ObjectLiteral>(entities.section)
   .findOneByOrFail({ id });

  await sleep(UPDATE_DELAY_MS);
  const patched = await app.inject({
   method: "PATCH",
   payload: { description: "patched" },
   url: `/config/sections/${id}`,
  });

  expect(patched.statusCode, patched.body).toBe(200);
  const saved: IConfigSection = await dataSource
   .getRepository<IConfigSection & ObjectLiteral>(entities.section)
   .findOneByOrFail({ id });

  expect(saved.name).toBe("dates-patch");
  expect(saved.description).toBe("patched");
  expect(saved.createdAt.getTime()).toBe(inserted.createdAt.getTime());
  expect(saved.updatedAt.getTime()).toBeGreaterThan(inserted.updatedAt.getTime());
 });

 it("moves only updatedAt when CrudConfigService.set overwrites a value", async () => {
  const configService: InstanceType<typeof CrudConfigService> = app.get(CrudConfigService);
  const read = async (): Promise<IConfigData> =>
   dataSource
    .getRepository<IConfigData & ObjectLiteral>(entities.data)
    .findOneByOrFail({ environment: "test", name: "DATES_VALUE" });

  await configService.set({ name: "DATES_VALUE", section: "dates-service", value: "first" });
  const inserted: IConfigData = await read();

  expect(inserted.createdAt).toBeInstanceOf(Date);
  expect(inserted.updatedAt).toBeInstanceOf(Date);

  await sleep(UPDATE_DELAY_MS);
  await configService.set({ name: "DATES_VALUE", section: "dates-service", value: "second" });
  const saved: IConfigData = await read();

  expect(saved.value).toBe("second");
  expect(saved.createdAt.getTime()).toBe(inserted.createdAt.getTime());
  expect(saved.updatedAt.getTime()).toBeGreaterThan(inserted.updatedAt.getTime());
 });
});
