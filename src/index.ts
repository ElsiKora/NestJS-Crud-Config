/**
 * Database-backed CRUD Configuration Module for NestJS
 *
 * This module provides a configuration management system for NestJS applications
 * using a database backend for storage. It enables easy configuration management
 * with CRUD operations, allowing applications to read, write, update, and delete
 * configuration values from a database.
 * @module nestjs-crud-config
 */

// Export core module
export * from "./modules/config";

// Export constants and enums
export * from "./shared";

export * from "./shared/enum";
export type * from "./shared/interface/config";
