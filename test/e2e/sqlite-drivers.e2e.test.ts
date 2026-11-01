import { ApiAuthorizationModule } from "@elsikora/nestjs-crud-automator";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { TypeOrmModule, type TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSource, type EntityManager } from "typeorm";
import { afterEach, describe, expect, it } from "vitest";

import {
 CrudConfigModule,
 CrudConfigService,
 TOKEN_CONSTANT,
 type IConfigMigrationDefinition,
 type TDynamicEntity,
} from "../../dist/index";

const MIGRATION: IConfigMigrationDefinition = {
 description: "Seeds one value inside the crud-config-migrations owner",
 name: "001_sqlite_seed",
 async up(configService: CrudConfigService, entityManager?: EntityManager): Promise<void> {
  await configService.set({
   environment: "test",
   eventManager: entityManager,
   name: "MIGRATED",
   section: "sqlite",
   value: "from-migration",
  });
 },
};

const DRIVERS: Array<{ connection: TypeOrmModuleOptions; type: string }> = [
 { connection: { database: ":memory:", type: "better-sqlite3" }, type: "better-sqlite3" },
 { connection: { type: "sqljs" }, type: "sqljs" },
];

describe.each(DRIVERS)(
 "CrudConfig with default entity options on $type",
 ({ connection, type }) => {
  let app: NestFastifyApplication | undefined;

  afterEach(async () => {
   await app?.close();
   app = undefined;
  });

  it("boots with the section, data and migration entities and runs the startup migration", async () => {
   const moduleRef = await Test.createTestingModule({
    imports: [
     // Generated routes run ApiAuthorizationGuard, whose runtime this global module provides
     ApiAuthorizationModule,
     CrudConfigModule.register({
      controllersOptions: {
       data: { isEnabled: true, properties: { path: "config/data" } },
       section: { isEnabled: true, properties: { path: "config/sections" } },
      },
      environment: "test",
      migrationOptions: {
       isEnabled: true,
       migrations: [MIGRATION],
       shouldRunOnStartup: true,
       useTransaction: true,
      },
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
       sectionEntity: TDynamicEntity,
       dataEntity: TDynamicEntity,
       migrationEntity: TDynamicEntity,
      ): TypeOrmModuleOptions =>
       ({
        ...connection,
        entities: [sectionEntity, dataEntity, migrationEntity],
        logging: false,
        retryAttempts: 0,
        synchronize: true,
       }) as TypeOrmModuleOptions,
     }),
    ],
   }).compile();

   app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter(), {
    logger: false,
   });
   await app.init();
   await app.getHttpAdapter().getInstance().ready();

   const dataSource: DataSource = app.get(DataSource);
   const configService: CrudConfigService = app.get(CrudConfigService);

   expect(dataSource.options.type).toBe(type);

   for (const table of ["config_section", "config_data", "config_migrations"]) {
    const columns = (await dataSource.query(`PRAGMA table_info("${table}")`)) as Array<{
     name: string;
     type: string;
    }>;

    expect(
     columns
      .filter((column) => ["createdAt", "updatedAt"].includes(column.name))
      .map((column) => column.type.toLowerCase()),
    ).toEqual(["datetime", "datetime"]);
   }

   // The startup migration ran in its owner transaction and recorded its history
   expect((await configService.get({ name: "MIGRATED", section: "sqlite" })).value).toBe(
    "from-migration",
   );
   const history = (await dataSource.query(
    'SELECT "name", "status", "executedAt" FROM "config_migrations"',
   )) as Array<{ executedAt: null | string; name: string; status: string }>;

   expect(history.map((row) => [row.name, row.status])).toEqual([["001_sqlite_seed", "COMPLETED"]]);
   expect(history[0]?.executedAt).not.toBeNull();

   // The status column only accepts the declared values
   await expect(
    dataSource.query(`UPDATE "config_migrations" SET "status" = 'UNKNOWN'`),
   ).rejects.toThrow(/CHECK constraint failed/);

   // Generated routes read and write the datetime columns
   const created = await app.inject({
    method: "POST",
    payload: { description: "created over http", name: "http-section" },
    url: "/config/sections",
   });

   expect(created.statusCode, created.body).toBe(201);
   expect(Number.isNaN(Date.parse(created.json<{ createdAt: string }>().createdAt))).toBe(false);
   const listed = await app.inject({ method: "GET", url: "/config/sections?limit=10&page=1" });

   expect(listed.statusCode, listed.body).toBe(200);
   expect(listed.json<{ totalCount: number }>().totalCount).toBe(2);
  });
 },
);
