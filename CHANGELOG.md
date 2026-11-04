# [5.1.0](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v5.0.0...v5.1.0) (2026-11-04)

### Features

- **entity:** name every constraint and index explicitly ([d716e37](https://github.com/ElsiKora/NestJS-Crud-Config/commit/d716e37d151f0388de687a89114508e88df67f0d))

# [5.0.0](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v4.1.0...v5.0.0) (2026-11-03)

### Bug Fixes

- **entity:** boot the default entities on sqlite and sql.js ([7feac93](https://github.com/ElsiKora/NestJS-Crud-Config/commit/7feac932a5d11a957698d078c2735434bc127d19))
- **entity:** register the entity timestamps as typeorm date columns ([1b99195](https://github.com/ElsiKora/NestJS-Crud-Config/commit/1b991950f56fccc4d718ddf6247e77d809dad9d8))
- **logger:** stop loading the consumer .env on import ([fd509fe](https://github.com/ElsiKora/NestJS-Crud-Config/commit/fd509fef8b66904012e37925a2994989bae63938))
- **migration:** log the migration service through the package logger ([fa65a40](https://github.com/ElsiKora/NestJS-Crud-Config/commit/fa65a40e1e3e96e8cb6752868e432543311cd250))

### Build System

- **package:** publish an esm-only build on automator 5, nestjs 12 and typeorm 1 ([9f352ee](https://github.com/ElsiKora/NestJS-Crud-Config/commit/9f352ee0ebf690903263f2fd03419ac8a8ae69e1))

### BREAKING CHANGES

- **entity:** updatedAt now changes on every save and update. On MySQL and MariaDB the three updatedAt columns gain ON UPDATE CURRENT_TIMESTAMP, which synchronize applies in place; PostgreSQL and SQLite schemas do not change. A TypeORM column decorator in the decorators option of createDynamicEntityClass now registers the column and wins over the options of the same property in columns.
- **entity:** on MySQL and MariaDB the default temporal columns are datetime instead of timestamp. Convert them with ALTER TABLE MODIFY before the upgrade, as the Migrating to 5.0 guide shows, because synchronize would drop and re-add them.
- **package:** the package is ESM only. dist/esm, dist/cjs and the require and import export conditions are removed; CommonJS applications load the package through require(esm). The peers are @elsikora/nestjs-crud-automator ^5.0.0-dev.5, @nestjs/common, @nestjs/core and @nestjs/platform-fastify ^12.3.2, @nestjs/passport ^12.0.0, @nestjs/swagger ^12.0.0, @nestjs/typeorm ^12.0.1, @nestjs/throttler ^6.7.1, typeorm ^1.1.2, fastify ^5.12.7, class-transformer ^0.5.1, class-validator ^0.15.1 and lodash ^4.18.1, and Node.js must be ^22.13.0 or >=24.11.0. The @nestjs/cache-manager dependency is now ^12.0.2.
- **logger:** importing @elsikora/nestjs-crud-config no longer loads a .env file. Applications that relied on it set NCC_LOG_LEVEL in the environment or load .env themselves, for example with ConfigModule.forRoot() or node --env-file.

# [4.1.0](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v4.0.3...v4.1.0) (2026-10-02)

### Features

- **migration:** support caller-owned migration transactions ([924524e](https://github.com/ElsiKora/NestJS-Crud-Config/commit/924524e37a59e28b8eb8dbdcf0d329014caf2d69))

## [4.0.3](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v4.0.2...v4.0.3) (2026-09-23)

### Bug Fixes

- **peer:** accept automator observation candidate ([f0c7566](https://github.com/ElsiKora/NestJS-Crud-Config/commit/f0c7566dc9093d057b12b881140a9d50729b8dcc))

## [4.0.2](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v4.0.1...v4.0.2) (2026-09-22)

### Bug Fixes

- **peer:** admit automator 4.4 prerelease compatibility ([c766cc3](https://github.com/ElsiKora/NestJS-Crud-Config/commit/c766cc39f40a1a7ae9c0ac90a98b8257fc8d24e7))

## [4.0.1](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v4.0.0...v4.0.1) (2026-09-14)

### Performance Improvements

- **config:** avoid joins for section key lookups ([203da7e](https://github.com/ElsiKora/NestJS-Crud-Config/commit/203da7ea0f7aa015dba6cf54ad370e1315da17a0))
- **crypto:** cache authenticated derived keys ([a8dc254](https://github.com/ElsiKora/NestJS-Crud-Config/commit/a8dc254c793e3e8cdd99c4784353ba41931c8679))

# [4.0.0](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v3.1.0...v4.0.0) (2026-08-20)

- build(deps)!: require crud automator 4 ([d776519](https://github.com/ElsiKora/NestJS-Crud-Config/commit/d776519d6cc30ea78efb4a5f65e5609d1070866f))

### Bug Fixes

- **release:** promote crud config 4 stable ([b4add09](https://github.com/ElsiKora/NestJS-Crud-Config/commit/b4add0955ec69b90a31b155a72349c2ea0655f04))

### BREAKING CHANGES

- CrudConfig now requires @elsikora/nestjs-crud-automator >=4.0.0-0 <5.0.0; Automator 3 is no longer supported.

# [3.1.0](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v3.0.0...v3.1.0) (2026-08-10)

### Bug Fixes

- **deps:** pin compatible platform fastify ([02b81ef](https://github.com/ElsiKora/NestJS-Crud-Config/commit/02b81ef3b940511da6f6b1a99b3fc33a1838fa8a))

### Features

- **config:** support temporal column type ([b34e596](https://github.com/ElsiKora/NestJS-Crud-Config/commit/b34e596d3a1004ee17cb26501f9835f5a3a30b79))

# [3.0.0](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v2.0.1...v3.0.0) (2026-07-26)

- feat(config)!: adopt automator transaction ownership ([1fd077e](https://github.com/ElsiKora/NestJS-Crud-Config/commit/1fd077ecac8c90e100d6c59d05e2f4cb88b588e4))

### BREAKING CHANGES

- Automator 2 and ConfigData before-insert event exports are no longer supported. Consumers must use @elsikora/nestjs-crud-automator 3.0.2 or newer.

## [2.0.1](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v2.0.0...v2.0.1) (2026-06-08)

# [2.0.0](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.2.2...v2.0.0) (2026-06-07)

- feat(config)!: support crud automator 2.8 ([a53d712](https://github.com/ElsiKora/NestJS-Crud-Config/commit/a53d7128b17966318c632842496c25df3b400eda))

### Bug Fixes

- **deps:** pin compatible nest swagger ([2ca8bb5](https://github.com/ElsiKora/NestJS-Crud-Config/commit/2ca8bb5317bbe6a7b7d9927c7382e3fdc8f3c8c8))

### BREAKING CHANGES

- custom controller route overrides must use Automator 2.8 route generation config, such as `generation.isEnabled`, instead of the legacy flat `isEnabled` route flag.

## [1.2.2](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.2.1...v1.2.2) (2026-05-06)

### Bug Fixes

- **deps:** make crud automator a peer dependency ([4313651](https://github.com/ElsiKora/NestJS-Crud-Config/commit/431365175395d6f6df32077614d25bbebd9c2875))

## [1.2.1](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.2.0...v1.2.1) (2026-01-06)

# [1.2.0](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.1.6...v1.2.0) (2026-01-06)

### Features

- **config:** add async staticoptions and nextra docs ([5c145ad](https://github.com/ElsiKora/NestJS-Crud-Config/commit/5c145adad9504f01f27e97b559c731ae9f016979))

## [1.1.6](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.1.5...v1.1.6) (2025-12-17)

### Bug Fixes

- **config:** add controllers support to register async method ([88c691d](https://github.com/ElsiKora/NestJS-Crud-Config/commit/88c691d12ecc6c1b63b0456fb176b046801c0919))

## [1.1.5](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.1.4...v1.1.5) (2025-12-17)

### Bug Fixes

- **config:** add controllers support to register async method ([32ccfd6](https://github.com/ElsiKora/NestJS-Crud-Config/commit/32ccfd6912f2327d09f74c391b4b38301e2bcc99))

## [1.1.4](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.1.3...v1.1.4) (2025-08-06)

## [1.1.3](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.1.2...v1.1.3) (2025-07-27)

## [1.1.2](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.1.1...v1.1.2) (2025-07-27)

## [1.1.1](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.1.0...v1.1.1) (2025-07-27)

# [1.1.0](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.0.1...v1.1.0) (2025-07-24)

### Features

- **config:** add configuration migration system with runner and comprehensive testing ([4c7402c](https://github.com/ElsiKora/NestJS-Crud-Config/commit/4c7402c1d42a9e7a370e4cbd4ff0f452ef3bfe7b))

## [1.0.1](https://github.com/ElsiKora/NestJS-Crud-Config/compare/v1.0.0...v1.0.1) (2025-07-14)

# 1.0.0 (2025-07-14)

### Features

- add full encryption support for configuration values ([515bfb7](https://github.com/ElsiKora/NestJS-Crud-Config/commit/515bfb7a7d0f859b46a2f7ba5f54c65c54a788d0))
- **config:** create database-backed configuration module with crud capabilities ([bc1b873](https://github.com/ElsiKora/NestJS-Crud-Config/commit/bc1b8732f5682bc192adb42141ad72b6f596c5b3))
- **config:** enhance configuration module with advanced encryption and documentation ([f0ce792](https://github.com/ElsiKora/NestJS-Crud-Config/commit/f0ce792c0b36e2aa20752fcaf7ffe95c29ebd2c4))
