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
- [Roadmap](#-roadmap)
- [FAQ](#-faq)
- [License](#-license)


## 📖 Description
NestJS CRUD Config is a powerful configuration management module that revolutionizes how NestJS applications handle configuration data. Unlike traditional environment variable approaches, this library stores configuration in a database with full CRUD operations, making it perfect for dynamic configuration management across multiple environments and services. The module provides hierarchical organization through sections and data entries, supports optional encryption for sensitive values, and includes automatic REST API endpoints for configuration management. Built with TypeScript-first design and leveraging the NestJS CRUD Automator for automatic API generation, it's ideal for microservice architectures, multi-tenant applications, and any system requiring centralized, database-backed configuration management with real-time updates. Whether you're managing API keys across different environments, storing feature flags, or maintaining application settings that need to change without redeployment, this module provides a robust, secure, and scalable solution.

## 🚀 Features
- ✨ **🗄️ **Database-backed configuration storage** - Store configuration in any TypeORM-supported database for persistence and scalability**
- ✨ **🏗️ **Dynamic entity creation** - Entities are created at runtime with customizable table names, field lengths, and constraints**
- ✨ **📊 **Hierarchical organization** - Organize configuration using sections and data entries for better structure and management**
- ✨ **🔐 **Optional encryption support** - Protect sensitive configuration values with built-in AES-256-GCM encryption**
- ✨ **🌍 **Multi-environment support** - Manage configurations across development, staging, and production environments seamlessly**
- ✨ **⚡ **Full CRUD operations** - Complete Create, Read, Update, Delete operations with automatic REST API endpoints**
- ✨ **📚 **Automatic Swagger documentation** - Generated OpenAPI documentation for all configuration endpoints**
- ✨ **🎯 **TypeScript-first design** - Full type safety with comprehensive interfaces and type definitions**
- ✨ **🚀 **NestJS CRUD Automator integration** - Leverages advanced CRUD automation for controllers and services**
- ✨ **💾 **Intelligent caching** - Built-in caching support with configurable TTL and cache size limits**
- ✨ **🔄 **Event-driven architecture** - Comprehensive event system with before/after hooks for custom business logic**
- ✨ **🎛️ **Highly customizable** - Configure table prefixes, field lengths, validation rules, and entity relationships**
- ✨ **🚦 **Flexible controller configuration** - Customize API paths, disable endpoints, or run in headless mode**
- ✨ **🔧 **Advanced CRUD customization** - Full control over routes, swagger documentation, and controller behavior**
- ✨ **📦 **Modular architecture** - Enable/disable features as needed for your use case**

## 🛠 Installation
```bash
# Using npm
npm install @elsikora/nestjs-crud-config

# Using yarn
yarn add @elsikora/nestjs-crud-config

# Using pnpm
pnpm add @elsikora/nestjs-crud-config


### Prerequisites

Install the required peer dependencies:


npm install @nestjs/common @nestjs/typeorm typeorm @elsikora/nestjs-crud-automator


### Database Support

This package works with any database supported by TypeORM:
- PostgreSQL
- MySQL/MariaDB
- SQLite
- Microsoft SQL Server
- Oracle
- MongoDB
- CockroachDB
```

## 💡 Usage
## 🚀 Quick Start

### Basic Setup

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrudConfigModule } from '@elsikora/nestjs-crud-config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'config_db',
        entities: [
          // Get dynamic entities - they are created when module is registered
          ...CrudConfigModule.getEntities(),
        ],
        synchronize: true,
      }),
    }),
    
    CrudConfigModule.register({
      environment: 'development',
      isVerbose: true,
      
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
          maxNameLength: 255,
          maxDescriptionLength: 1000,
        },
        configData: {
          tableName: 'config_data',
          maxValueLength: 16384,
          maxEnvironmentLength: 100,
        },
      },
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
      environment: 'production', // Optional, uses default from module config
    });

    // Retrieve configuration by section and name
    const apiConfig = await this.configService.get({
      section: 'api-settings',
      name: 'API_KEY',
      environment: 'production',
      shouldLoadSectionInfo: true, // Optional, loads section details
      useCache: true, // Optional, uses cache if enabled
    });

    console.log('API Configuration:', apiConfig);
    // apiConfig.value will be automatically decrypted if it was encrypted
    
    return apiConfig;
  }
}
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
  // ... other options
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

### Controller Configuration

The module provides flexible controller configuration options:

```typescript
CrudConfigModule.register({
  controllersOptions: {
    // Disable controllers completely (headless mode)
    section: { isEnabled: false },
    data: { isEnabled: false },
  },
})

// Or customize controller paths and behavior
CrudConfigModule.register({
  controllersOptions: {
    section: {
      properties: {
        name: 'ConfigSectionController',
        path: 'api/v1/settings/sections',
        swagger: {
          tags: ['Settings API'],
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
      // Database configuration per environment
      await this.configService.set({
        section: 'database',
        name: 'DATABASE_URL',
        environment: env,
        value: `postgres://localhost:5432/${env}_db`,
        description: `Database URL for ${env} environment`,
      });

      // Logging configuration per environment
      await this.configService.set({
        section: 'logging',
        name: 'LOG_LEVEL',
        environment: env,
        value: env === 'production' ? 'error' : 'debug',
        description: `Log level for ${env} environment`,
      });
    }
  }
}
```

## 🔌 REST API Endpoints

The module automatically generates REST API endpoints with customizable paths:

### Configuration Sections (default: `/config/section`)
- `GET /config/section` - List all sections
- `POST /config/section` - Create a new section
- `GET /config/section/:id` - Get section by ID
- `PUT /config/section/:id` - Update section
- `DELETE /config/section/:id` - Delete section

### Configuration Data (default: `/config/data`)
- `GET /config/data` - List all configuration data
- `POST /config/data` - Create new configuration
- `GET /config/data/:id` - Get configuration by ID
- `PUT /config/data/:id` - Update configuration
- `DELETE /config/data/:id` - Delete configuration

### Customizing Endpoints

```typescript
CrudConfigModule.register({
  controllersOptions: {
    section: {
      properties: {
        path: 'api/v1/settings/sections', // Custom path
      },
    },
    data: {
      properties: {
        path: 'api/v1/settings/data', // Custom path
        routes: {
          DELETE: { isEnabled: false }, // Disable specific routes
        },
      },
    },
  },
})
```

### Example API Usage

```bash
# Create a configuration section
curl -X POST http://localhost:3000/config/section \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api-settings",
    "description": "API configuration settings"
  }'

# Create configuration data
curl -X POST http://localhost:3000/config/data \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API_KEY",
    "value": "your-secret-key",
    "environment": "production",
    "description": "Production API key",
    "isEncrypted": true,
    "section": { "id": "section-uuid-here" }
  }'
```

## 📊 Database Schema

The module creates two main tables (with optional prefix):

### Configuration Sections Table
```sql
CREATE TABLE app_config_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Configuration Data Table
```sql
CREATE TABLE app_config_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  value VARCHAR(16384) NOT NULL,
  environment VARCHAR(100) NOT NULL,
  description VARCHAR(1000),
  is_encrypted BOOLEAN DEFAULT FALSE,
  section_id UUID NOT NULL REFERENCES app_config_sections(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, environment, section_id)
);
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
| Configuration encryption support | ✅ Done |
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
## ❓ Frequently Asked Questions

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
  shouldEncryptValues: true,
  encryptionKey: process.env.CONFIG_ENCRYPTION_KEY,
  // ... other options
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
      maxNameLength: 512,
      maxDescriptionLength: 2048,
    },
    configData: {
      tableName: 'configuration_values',
      maxValueLength: 32768, // 32KB values
      maxEnvironmentLength: 128,
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
  // ... other options
})
```

This is perfect for:
- Background services that only need programmatic access
- Microservices that manage config through message queues
- Applications with custom GraphQL or gRPC interfaces

### Is this production-ready?

Yes! The module is built with production use in mind:
- **Type-safe** - Full TypeScript support prevents runtime errors
- **Battle-tested** - Built on proven technologies (NestJS, TypeORM)
- **Scalable** - Works with enterprise databases
- **Secure** - Built-in encryption and validation
- **Observable** - Comprehensive logging and monitoring hooks

## 🔒 License
This project is licensed under **This project is licensed under **MIT License**

Copyright (c) 2025 ElsiKora

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**.
