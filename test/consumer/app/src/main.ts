import type { IConfigData } from "@elsikora/nestjs-crud-config";
import type { DynamicModule } from "@nestjs/common";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { OpenAPIObject } from "@nestjs/swagger";

import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

import { CrudConfigService } from "@elsikora/nestjs-crud-config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { DataSource } from "typeorm";

import {
 createRegisterAsyncModule,
 createRegisterModule,
 ENCRYPTION_KEY,
 ENVIRONMENT,
 getTableNames,
 MIGRATED_NAME,
 SECTION,
} from "./module.js";

import "reflect-metadata";

interface IResponse {
 body: Record<string, unknown>;
 status: number;
}

/**
 * Creates an empty database for one scenario, so consumers that share a server never see each other's tables or indexes.
 * @returns {Promise<{ drop: () => Promise<void>, url: string }>} The database URL and a callback that drops it.
 */
async function createDatabase(): Promise<{ drop: () => Promise<void>; url: string }> {
 const serverUrl: string = process.env.DATABASE_URL ?? "";
 const admin: DataSource = new DataSource({ type: "postgres", url: serverUrl });
 const name: string = `crud_config_smoke_${randomBytes(4).toString("hex")}`;
 const url: URL = new URL(serverUrl);

 await admin.initialize();
 await admin.query(`CREATE DATABASE "${name}"`);
 url.pathname = `/${name}`;

 return {
  drop: async (): Promise<void> => {
   await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
   await admin.destroy();
  },
  url: url.toString(),
 };
}

/**
 * Sends one JSON request to the running application.
 * @param {string} baseUrl - Application URL.
 * @param {string} method - HTTP method.
 * @param {string} path - Route path.
 * @param {unknown} [body] - JSON body.
 * @returns {Promise<IResponse>} The status and the parsed body.
 */
async function request(
 baseUrl: string,
 method: string,
 path: string,
 body?: unknown,
): Promise<IResponse> {
 const response: Response = await fetch(`${baseUrl}${path}`, {
  body: body === undefined ? undefined : JSON.stringify(body),
  headers: body === undefined ? undefined : { "content-type": "application/json" },
  method,
 });
 const text: string = await response.text();

 return {
  body: text === "" ? {} : (JSON.parse(text) as Record<string, unknown>),
  status: response.status,
 };
}

/**
 * Starts a Nest 12 Fastify application with CrudConfig against Postgres and checks the startup migration, encrypted
 * and cached service reads and writes, the generated section and data routes, the OpenAPI document and close.
 * @param {string} name - Scenario name.
 * @param {(prefix: string, url: string) => DynamicModule} createModule - Builds the application module.
 * @returns {Promise<void>}
 */
async function runScenario(
 name: string,
 createModule: (prefix: string, url: string) => DynamicModule,
): Promise<void> {
 const prefix: string = "smoke_";
 const tables: { data: string; migration: string; section: string } = getTableNames(prefix);
 const database: { drop: () => Promise<void>; url: string } = await createDatabase();
 let app: NestFastifyApplication | undefined;

 try {
  app = await NestFactory.create<NestFastifyApplication>(
   createModule(prefix, database.url),
   new FastifyAdapter(),
   { abortOnError: false, logger: false },
  );
  await app.listen(0, "127.0.0.1");
  const dataSource: DataSource = app.get(DataSource);
  const baseUrl: string = await app.getUrl();
  const configService: CrudConfigService = app.get(CrudConfigService);

  assert.equal(dataSource.options.type, "postgres");

  // The startup migration ran inside its owner transaction and recorded its history
  const migrated: IConfigData = await configService.get({
   environment: ENVIRONMENT,
   name: MIGRATED_NAME,
   section: SECTION,
  });

  assert.equal(migrated.value, "from-migration");
  const history: Array<{ name: string; status: string }> = await dataSource.query(
   `SELECT "name", "status" FROM "${tables.migration}"`,
  );

  assert.deepEqual(
   history.map((row: { name: string; status: string }) => [row.name, row.status]),
   [["001_consumer_smoke", "COMPLETED"]],
  );

  // Values are stored encrypted and read back in plain text, also from the cache
  await configService.set({
   environment: ENVIRONMENT,
   name: "API_KEY",
   section: SECTION,
   value: "plain-secret",
  });
  const stored: Array<{ value: string }> = await dataSource.query(
   `SELECT "value" FROM "${tables.data}" WHERE "name" = $1`,
   ["API_KEY"],
  );

  assert.equal(stored.length, 1);
  assert.notEqual(stored[0]?.value, "plain-secret");
  assert.equal(stored[0]?.value.includes(ENCRYPTION_KEY), false);
  assert.equal(
   (
    await configService.get({
     environment: ENVIRONMENT,
     name: "API_KEY",
     section: SECTION,
     useCache: true,
    })
   ).value,
   "plain-secret",
  );
  assert.equal(
   (
    await configService.get({
     environment: ENVIRONMENT,
     name: "API_KEY",
     section: SECTION,
     useCache: true,
    })
   ).value,
   "plain-secret",
  );
  assert.deepEqual(
   (await configService.getList({ environment: ENVIRONMENT, section: SECTION }))
    .map((item: IConfigData) => item.name)
    .sort(),
   ["API_KEY", MIGRATED_NAME],
  );

  // Generated routes from Automator 5
  const section: IResponse = await request(baseUrl, "POST", "/smoke/sections", {
   description: "created over http",
   name: "http-section",
  });

  assert.equal(section.status, 201, JSON.stringify(section.body));
  assert.equal(section.body.name, "http-section");
  const data: IResponse = await request(baseUrl, "POST", "/smoke/data", {
   environment: ENVIRONMENT,
   isEncrypted: false,
   name: "HTTP_VALUE",
   section: { id: section.body.id },
   value: "over-http",
  });

  assert.equal(data.status, 201, JSON.stringify(data.body));
  const fetched: IResponse = await request(baseUrl, "GET", `/smoke/data/${String(data.body.id)}`);

  assert.equal(fetched.status, 200, JSON.stringify(fetched.body));
  assert.equal(fetched.body.value, "over-http");
  const listed: IResponse = await request(baseUrl, "GET", "/smoke/sections?limit=10&page=1");

  assert.equal(listed.status, 200, JSON.stringify(listed.body));
  assert.equal(listed.body.totalCount, 2, JSON.stringify(listed.body));
  const missing: IResponse = await request(
   baseUrl,
   "GET",
   "/smoke/sections/00000000-0000-4000-8000-000000000000",
  );

  assert.equal(missing.status, 404, JSON.stringify(missing.body));
  const deleted: IResponse = await request(
   baseUrl,
   "DELETE",
   `/smoke/data/${String(data.body.id)}`,
  );

  assert.equal(deleted.status, 204, JSON.stringify(deleted.body));

  // Swagger 12 documents the generated routes
  const document: OpenAPIObject = SwaggerModule.createDocument(
   app,
   new DocumentBuilder().setTitle("smoke").build(),
  );

  assert.ok(document.paths["/smoke/sections"], Object.keys(document.paths).join(", "));
  assert.ok(document.paths["/smoke/data/{id}"], Object.keys(document.paths).join(", "));

  await app.close();
  app = undefined;
  process.stdout.write(`PASS ${name}\n`);
 } finally {
  await app?.close();
  await database.drop();
 }
}

/**
 * Runs both registration forms one after another; CommonJS consumers have no top-level await.
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
 await runScenario("register", createRegisterModule);
 await runScenario("registerAsync", createRegisterAsyncModule);
}

main().catch((error: unknown) => {
 process.stderr.write(
  `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
 );
 process.exitCode = 1;
});
