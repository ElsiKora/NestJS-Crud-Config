<p align="center">
  <img src="https://6jft62zmy9nx2oea.public.blob.vercel-storage.com/nestjs-crud-config-dCbe8myqKpk3fxrTwBFBVCkKaz399M.png" width="500" alt="project-logo">
</p>

<h1 align="center">NestJS CRUD Config 🚀</h1>
<p align="center"><em>Database-backed configuration management for NestJS applications with full CRUD capabilities</em></p>

<p align="center">
    <a aria-label="ElsiKora logo" href="https://elsikora.com">
  <img src="https://img.shields.io/badge/MADE%20BY%20ElsiKora-333333.svg?style=for-the-badge" alt="ElsiKora">
</a> <img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"> <img src="https://img.shields.io/badge/NestJS-E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS"> <img src="https://img.shields.io/badge/Node.js-339933.svg?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"> <img src="https://img.shields.io/badge/PostgreSQL-4169E1.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"> <img src="https://img.shields.io/badge/MySQL-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL"> <img src="https://img.shields.io/badge/SQLite-003B57.svg?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"> <img src="https://img.shields.io/badge/MongoDB-47A248.svg?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"> <img src="https://img.shields.io/badge/Swagger-85EA2D.svg?style=for-the-badge&logo=swagger&logoColor=black" alt="Swagger">
</p>


## 📚 Table of Contents
- [Description](#-description)
- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Advanced Configuration](#-advanced-configuration)
- [Roadmap](#-roadmap)
- [FAQ](#-faq)
- [License](#-license)


## 📖 Description

NestJS CRUD Config is a powerful configuration management module that revolutionizes how NestJS applications handle configuration data. Unlike traditional environment variable approaches, this library stores configuration in a database with full CRUD operations, making it perfect for dynamic configuration management across multiple environments and services.

The module provides hierarchical organization through sections and data entries, supports optional AES-256-GCM encryption for sensitive values, and includes automatic REST API endpoints for configuration management. Built with TypeScript-first design and leveraging the NestJS CRUD Automator for automatic API generation, it features dynamic entity creation at runtime, comprehensive event-driven architecture, and intelligent caching.

Whether you're managing API keys across different environments, storing feature flags, or maintaining application settings that need to change without redeployment, this module provides a robust, secure, and scalable solution for microservice architectures, multi-tenant applications, and any system requiring centralized, database-backed configuration management with real-time updates.

## 🚀 Features

- **🗄️ Database-backed configuration storage** - Store configuration in any TypeORM-supported database for persistence and scalability
- **🏗️ Dynamic entity creation** - Entities are created at runtime with customizable table names, field lengths, and constraints
- **📊 Hierarchical organization** - Organize configuration using sections and data entries for better structure and management
- **🔐 AES-256-GCM encryption support** - Protect sensitive configuration values with built-in encryption using industry-standard algorithms
- **🌍 Multi-environment support** - Manage configurations across development, staging, and production environments seamlessly
- **⚡ Full CRUD operations** - Complete Create, Read, Update, Delete operations with automatic REST API endpoints
- **📚 Automatic Swagger documentation** - Generated OpenAPI documentation for all configuration endpoints
- **🎯 TypeScript-first design** - Full type safety with comprehensive interfaces and type definitions
- **🚀 NestJS CRUD Automator integration** - Leverages advanced CRUD automation for controllers and services
- **💾 Intelligent caching** - Built-in caching support with configurable TTL and cache size limits
- **🔄 Event-driven architecture** - Comprehensive event system with before/after hooks and TypeORM subscribers
- **🎛️ Highly customizable** - Configure table prefixes, field lengths, validation rules, and entity relationships
- **🚦 Flexible controller configuration** - Customize API paths, disable endpoints, or run in headless mode
- **🔧 Advanced CRUD customization** - Full control over routes, swagger documentation, and controller behavior
- **📦 Modular architecture** - Enable/disable features as needed for your use case

## 🛠 Installation

```bash
# Using npm
npm install @elsikora/nestjs-crud-config

# Using yarn
yarn add @elsikora/nestjs-crud-config

# Using pnpm
pnpm add @elsikora/nestjs-crud-config
```

### Prerequisites

Install the required peer dependencies:

```bash
npm install @nestjs/common @nestjs/typeorm typeorm @elsikora/nestjs-crud-automator
```

### Database Support

This package works with any database supported by TypeORM:
- PostgreSQL
- MySQL/MariaDB
- SQLite
- Microsoft SQL Server
- Oracle
- MongoDB
- CockroachDB

## 💡 Usage

### Basic Setup

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudConfigModule, TOKEN_CONSTANT } from '@elsikora/nestjs-crud-config';

@Module({
  imports: [
    // First register CrudConfigModule to create dynamic entities
    CrudConfigModule.register({
      environment: 'development',
      isVerbose: true,
      shouldAutoCreateSections: true,
      
      // Cache configuration
      cacheOptions: {
        isEnabled: true,
        maxCacheItems: 1000,
        maxCacheTTL: 3600000, // 1 hour in milliseconds
      },
      
      // Encryption configuration
      encryptionOptions: {
        isEnabled: true,
        encryptionKey: process.env.CONFIG_ENCRYPTION_KEY, // 32+ character key
      },
      
      // Controller configuration (optional)
      controllersOptions: {
        section: {
          isEnabled: true,
          properties: {
            path: 'api/config/sections',
          },
        },
        data: {
          isEnabled: true,
          properties: {
            path: 'api/config/data',
          },
        },
      },
      
      // Entity customization
      entityOptions: {
        tablePrefix: 'app_',
        configSection: {
          tableName: 'config_sections',
          maxNameLength: 128,
          maxDescriptionLength: 512,
        },
        configData: {
          tableName: 'config_data',
          maxValueLength: 8192,
          maxEnvironmentLength: 64,
          maxNameLength: 128,
          maxDescriptionLength: 512,
        },
      },
    }),
    
    // Then register TypeORM with dynamic entities using registerAsync
    TypeOrmModule.forRootAsync({
      imports: [CrudConfigModule],
      inject: [
        TOKEN_CONSTANT.CONFIG_SECTION_ENTITY,
        TOKEN_CONSTANT.CONFIG_DATA_ENTITY,
      ],
      useFactory: async (sectionEntity, dataEntity) => ({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'config_db',
        entities: [
          // Your other entities
          // UserEntity, ProductEntity, etc.
          
          // Dynamic entities from CrudConfigModule
          sectionEntity,
          dataEntity,
        ],
        synchronize: true,
      }),
    }),
  ],
})
export class AppModule {}
```

### Using the Configuration Service

```typescript
// config.service.ts
import { Injectable } from '@nestjs/common';
import { CrudConfigService } from '@elsikora/nestjs-crud-config';

@Injectable()
export class MyConfigService {
  constructor(
    private readonly configService: CrudConfigService,
  ) {}

  async setupApplicationConfig() {
    // Set a configuration value
    await this.configService.set({
      section: 'api-settings',
      name: 'API_KEY',
      value: 'my-secret-api-key',
      description: 'Production API key',
      environment: 'production',
    });

    // Retrieve configuration by section and name
    const apiConfig = await this.configService.get({
      section: 'api-settings',
      name: 'API_KEY',
      environment: 'production',
      shouldLoadSectionInfo: true,
      useCache: true,
    });

    console.log('API Configuration:', apiConfig);
    // apiConfig.value will be automatically decrypted if it was encrypted
    
    return apiConfig;
  }

  async getConfigurationList() {
    // Get all configurations in a section
    const configs = await this.configService.getList({
      section: 'api-settings',
      environment: 'production',
      useCache: true,
    });

    return configs;
  }

  async deleteConfiguration() {
    // Delete a configuration
    await this.configService.delete({
      section: 'api-settings',
      name: 'API_KEY',
      environment: 'production',
    });
  }
}
```

### Async Module Registration

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CrudConfigModule } from '@elsikora/nestjs-crud-config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    CrudConfigModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        environment: configService.get('NODE_ENV', 'development'),
        isVerbose: configService.get('VERBOSE', false),
        encryptionOptions: {
          isEnabled: true,
          encryptionKey: configService.get('ENCRYPTION_KEY'),
        },
        cacheOptions: {
          isEnabled: true,
          maxCacheItems: 1000,
          maxCacheTTL: 3600000,
        },
      }),
    }),
  ],
})
export class AppModule {}
```

## 📚 API Documentation

The module automatically generates REST API endpoints with customizable paths:

### Configuration Sections (default: `/config/section`)

- `GET /config/section` - List all sections
- `POST /config/section` - Create a new section
- `GET /config/section/:id` - Get section by ID
- `PUT /config/section/:id` - Update section
- `DELETE /config/section/:id` - Delete section

**Request Body for POST/PUT:**
```json
{
  "name": "api-settings",
  "description": "API configuration settings"
}
```

### Configuration Data (default: `/config/data`)

- `GET /config/data` - List all configuration data
- `POST /config/data` - Create new configuration
- `GET /config/data/:id` - Get configuration by ID
- `PUT /config/data/:id` - Update configuration
- `DELETE /config/data/:id` - Delete configuration

**Request Body for POST/PUT:**
```json
{
  "name": "API_KEY",
  "value": "your-secret-key",
  "environment": "production",
  "description": "Production API key",
  "isEncrypted": true,
  "section": { "id": "section-uuid-here" }
}
```

### Customizing API Endpoints

```typescript
CrudConfigModule.register({
  controllersOptions: {
    section: {
      properties: {
        path: 'api/v1/settings/sections',
        name: 'CustomSectionController',
        swagger: {
          tags: ['Configuration Sections'],
        },
      },
    },
    data: {
      properties: {
        path: 'api/v1/settings/data',
        routes: {
          DELETE: { isEnabled: false }, // Disable deletion
        },
      },
    },
  },
})
```

## 🗄️ Database Schema

The module creates two main tables with the following default structure:

### Configuration Sections Table (`config_section`)
```sql
CREATE TABLE config_section (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(128) NOT NULL UNIQUE,
  description VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Configuration Data Table (`config_data`)
```sql
CREATE TABLE config_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(128) NOT NULL,
  value VARCHAR(8192) NOT NULL,
  environment VARCHAR(64) NOT NULL,
  description VARCHAR(512),
  is_encrypted BOOLEAN DEFAULT FALSE,
  section_id UUID NOT NULL REFERENCES config_section(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, environment, section_id)
);
```

## 🔧 Advanced Configuration

### Encryption Support

The module provides built-in AES-256-GCM encryption for sensitive configuration values:

```typescript
// Enable encryption globally
CrudConfigModule.register({
  encryptionOptions: {
    isEnabled: true,
    encryptionKey: process.env.CONFIG_ENCRYPTION_KEY, // 32+ character key
  },
})

// When encryption is enabled, all values are encrypted automatically
await configService.set({
  section: 'database',
  name: 'DB_PASSWORD',
  value: 'my-secret-password',
});

// Retrieve and decrypt automatically
const config = await configService.get({
  section: 'database',
  name: 'DB_PASSWORD',
});

console.log(config.value); // Automatically decrypted value
console.log(config.isEncrypted); // true
```

### Event-Driven Architecture

The module includes comprehensive event handling with both listeners and TypeORM subscribers:

```typescript
// Event listener example
@Injectable()
export class ConfigDataBeforeInsertListener {
  @OnEvent('config-data.beforeInsert')
  async handleBeforeInsert(payload: ConfigDataEventBeforeInsert) {
    // Custom validation logic
    const entity = payload.item;
    const entityManager = payload.eventManager;
    
    // Perform custom checks
    return { isSuccess: true };
  }
}

// TypeORM subscriber for database-level events
@EventSubscriber()
export class ConfigDataBeforeInsertSubscriber {
  beforeInsert(event: InsertEvent<IConfigData>) {
    // Database-level validation
    return Promise.resolve(true);
  }
}
```

### Headless Mode (Without Controllers)

```typescript
CrudConfigModule.register({
  controllersOptions: {
    section: { isEnabled: false },
    data: { isEnabled: false },
  },
})
```

This is perfect for:
- Background services that only need programmatic access
- Microservices that manage config through message queues
- Applications with custom GraphQL or gRPC interfaces

### Working with Multiple Environments

```typescript
// multi-env.service.ts
@Injectable()
export class MultiEnvironmentService {
  constructor(
    private readonly configService: CrudConfigService,
  ) {}

  async setupEnvironmentConfigs() {
    const environments = ['development', 'staging', 'production'];
    
    for (const env of environments) {
      await this.configService.set({
        section: 'database',
        name: 'DATABASE_URL',
        environment: env,
        value: `postgres://localhost:5432/${env}_db`,
        description: `Database URL for ${env} environment`,
      });
    }
  }
}
```

## 🛣 Roadmap

| Task / Feature | Status |
|---|---|
| Core dynamic entity system | ✅ Done |
| TypeORM integration with all databases | ✅ Done |
| Hierarchical configuration (sections/data) | ✅ Done |
| Full CRUD operations with REST API | ✅ Done |
| Swagger/OpenAPI documentation | ✅ Done |
| Multi-environment support | ✅ Done |
| Event-driven architecture with hooks | ✅ Done |
| Caching system with TTL | ✅ Done |
| Custom table names and prefixes | ✅ Done |
| Validation and constraints | ✅ Done |
| NestJS CRUD Automator integration | ✅ Done |
| TypeScript interfaces and types | ✅ Done |
| AES-256-GCM encryption support | ✅ Done |
| Async module registration | ✅ Done |
| Auto-section creation | ✅ Done |
| GraphQL API endpoints | 🚧 In Progress |
| Configuration versioning and history | 🚧 In Progress |
| Role-based access control (RBAC) | 🚧 In Progress |
| Configuration templates and inheritance | 🚧 In Progress |
| Real-time configuration updates via WebSocket | 🚧 In Progress |
| Configuration validation schemas | 🚧 In Progress |
| Bulk import/export functionality | 🚧 In Progress |
| Configuration diff and merge tools | 🚧 In Progress |
| Audit logging and change tracking | 🚧 In Progress |
| Configuration backup and restore | 🚧 In Progress |
| Integration with external secret managers | 🚧 In Progress |

## ❓ FAQ

### What databases are supported?

The module supports any database that TypeORM supports, including:
- **PostgreSQL** - Recommended for production
- **MySQL/MariaDB** - Popular choice for web applications
- **SQLite** - Perfect for development and testing
- **Microsoft SQL Server** - Enterprise database support
- **Oracle** - Enterprise-grade database
- **MongoDB** - NoSQL document database
- **CockroachDB** - Distributed SQL database

### How does this compare to environment variables?

While environment variables are great for simple configurations, this module provides:
- **Database persistence** - Configurations survive container restarts
- **Runtime updates** - Change configurations without redeployment
- **Hierarchical organization** - Group related configurations
- **Multi-environment support** - Manage dev/staging/prod from one place
- **Encryption support** - Secure sensitive data
- **REST API** - Manage configurations programmatically
- **Audit trails** - Track configuration changes

### Can I migrate from environment variables?

Yes! You can easily migrate by programmatically setting configurations during application startup:

```typescript
async function migrateFromEnvVars() {
  const configs = [
    { section: 'database', name: 'DATABASE_URL', value: process.env.DATABASE_URL },
    { section: 'api', name: 'API_KEY', value: process.env.API_KEY },
    // ... more configurations
  ];
  
  for (const config of configs) {
    await configService.set(config);
  }
}
```

### How do I handle sensitive configuration data?

The module provides built-in AES-256-GCM encryption support:

```typescript
CrudConfigModule.register({
  encryptionOptions: {
    isEnabled: true,
    encryptionKey: process.env.CONFIG_ENCRYPTION_KEY,
  },
})
```

Sensitive values are automatically encrypted before storage and decrypted when retrieved.

### Can I use this with microservices?

Absolutely! The module is perfect for microservice architectures:
- **Centralized configuration** - All services can share the same config database
- **Service-specific sections** - Organize configurations by service
- **Environment isolation** - Separate dev/staging/prod configurations
- **Dynamic updates** - Update configurations without service restarts

### How do I customize table names and field sizes?

The module provides extensive customization options:

```typescript
CrudConfigModule.register({
  entityOptions: {
    tablePrefix: 'myapp_',
    configSection: {
      tableName: 'configuration_sections',
      maxNameLength: 256,
      maxDescriptionLength: 1024,
    },
    configData: {
      tableName: 'configuration_values',
      maxValueLength: 16384, // 16KB values
      maxEnvironmentLength: 128,
      maxNameLength: 256,
      maxDescriptionLength: 1024,
    },
  },
})
```

### What happens if the database is unavailable?

The module includes caching to handle temporary database outages:
- **In-memory cache** - Recently accessed configurations are cached
- **Configurable TTL** - Control how long configurations are cached
- **Graceful degradation** - Falls back to cached values when database is unavailable

### Can I use this without REST API endpoints?

Yes! The module supports "headless mode" where controllers are disabled:

```typescript
CrudConfigModule.register({
  controllersOptions: {
    section: { isEnabled: false },
    data: { isEnabled: false },
  },
})
```

### Is this production-ready?

Yes! The module is built with production use in mind:
- **Type-safe** - Full TypeScript support prevents runtime errors
- **Battle-tested** - Built on proven technologies (NestJS, TypeORM)
- **Scalable** - Works with enterprise databases
- **Secure** - Built-in encryption and validation
- **Observable** - Comprehensive logging and monitoring hooks

## 🔒 License

This project is licensed under **MIT License**

Copyright (c) 2025 ElsiKora

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
