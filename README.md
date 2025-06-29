<p align="center">
  <img src="https://socialify.git.ci/ElsiKora/NestJS-Crud-Config/image?description=1&font=Inter&forks=1&issues=1&language=1&name=1&owner=1&pattern=Circuit+Board&stargazers=1&theme=Light" width="700" alt="project-logo">
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
NestJS CRUD Config is a powerful configuration management module that revolutionizes how NestJS applications handle configuration data. Unlike traditional environment variable approaches, this library stores configuration in a database with full CRUD operations, making it perfect for dynamic configuration management across multiple environments and services. The module provides hierarchical organization through sections and data entries, supports optional encryption for sensitive values, and includes automatic REST API endpoints for configuration management. Built with TypeScript-first design and leveraging the NestJS CRUD Automator for automatic API generation, it's ideal for microservice architectures, multi-tenant applications, and any system requiring centralized, database-backed configuration management with real-time updates.

## 🚀 Features
- ✨ **🗄️ **Database-backed configuration storage** - Store configuration in any TypeORM-supported database for persistence and scalability**
- ✨ **🏗️ **Dynamic entity creation** - Entities are created at runtime with customizable table names, field lengths, and constraints**
- ✨ **📊 **Hierarchical organization** - Organize configuration using sections and data entries for better structure and management**
- ✨ **🔐 **Optional encryption support** - Protect sensitive configuration values with built-in encryption capabilities**
- ✨ **🌍 **Multi-environment support** - Manage configurations across development, staging, and production environments seamlessly**
- ✨ **⚡ **Full CRUD operations** - Complete Create, Read, Update, Delete operations with automatic REST API endpoints**
- ✨ **📚 **Automatic Swagger documentation** - Generated OpenAPI documentation for all configuration endpoints**
- ✨ **🎯 **TypeScript-first design** - Full type safety with comprehensive interfaces and type definitions**
- ✨ **🚀 **NestJS CRUD Automator integration** - Leverages advanced CRUD automation for controllers and services**
- ✨ **💾 **Intelligent caching** - Built-in caching support with configurable TTL and cache size limits**
- ✨ **🔄 **Event-driven architecture** - Comprehensive event system with before/after hooks for custom business logic**
- ✨ **🎛️ **Highly customizable** - Configure table prefixes, field lengths, validation rules, and entity relationships**

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
          // Get dynamic entities with custom configuration
          ...CrudConfigModule.getEntities({
            entityOptions: {
              tablePrefix: 'app_',
              configSection: {
                tableName: 'config_sections',
                maxNameLength: 255,
              },
              configData: {
                tableName: 'config_data',
                maxValueLength: 16384,
              },
            },
          }),
        ],
        synchronize: true,
      }),
    }),
    
    CrudConfigModule.register({
      application: 'my-app',
      environment: 'development',
      isVerbose: true,
      cacheOptions: {
        isEnabled: true,
        maxCacheItems: 1000,
        maxCacheTTL: 300000, // 5 minutes
      },
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
    // Retrieve configuration by section and name
    const apiConfig = await this.configService.get({
      section: 'api-settings',
      name: 'API_KEY',
      environment: 'production',
      shouldDecrypt: true,
      shouldLoadSectionInfo: true,
    });

    console.log('API Configuration:', apiConfig);
    return apiConfig;
  }
}
```

## 🔧 Advanced Configuration

### Async Module Registration

```typescript
// app.module.ts
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    
    CrudConfigModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        application: configService.get('APP_NAME'),
        environment: configService.get('NODE_ENV'),
        shouldEncryptValues: configService.get('ENCRYPT_CONFIG') === 'true',
        encryptionKey: configService.get('ENCRYPTION_KEY'),
        entityOptions: {
          tablePrefix: configService.get('TABLE_PREFIX') || 'app_',
          configData: {
            maxValueLength: parseInt(configService.get('MAX_CONFIG_SIZE') || '8192'),
          },
        },
      }),
    }),
  ],
})
export class AppModule {}
```

### Encryption Support

The module provides built-in AES-256-GCM encryption for sensitive configuration values:

```typescript
// Enable encryption globally
CrudConfigModule.register({
  shouldEncryptValues: true,
  encryptionKey: process.env.CONFIG_ENCRYPTION_KEY, // 32+ character key
  // ... other options
})

// Or use encryption selectively
await configService.set({
  section: 'database',
  name: 'DB_PASSWORD',
  shouldEncrypt: true, // Encrypt this specific value
}, 'my-secret-password');

// Retrieve and decrypt automatically
const config = await configService.get({
  section: 'database',
  name: 'DB_PASSWORD',
  shouldDecrypt: true, // Default is true
});

console.log(config.value); // Decrypted value
console.log(config.isEncrypted); // true
```

#### Encryption Features

- **AES-256-GCM encryption**: Industry-standard encryption with authentication
- **Automatic encryption/decryption**: Seamless integration with get/set operations  
- **Selective encryption**: Encrypt only sensitive values to optimize performance
- **Key derivation**: Uses scrypt for secure key derivation with unique salts
- **Safe storage**: Encrypted values are stored as base64-encoded strings

#### Best Practices

1. **Never hardcode encryption keys** - Use environment variables or secret managers
2. **Use different keys per environment** - Separate keys for dev, staging, production
3. **Encrypt only sensitive data** - Passwords, API keys, tokens, etc.
4. **Set appropriate field lengths** - Encrypted values are ~2x longer than plaintext

See the [encryption example](examples/encryption.example.ts) for detailed usage patterns.

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
      await this.setConfig({
        section: 'database',
        name: 'DATABASE_URL',
        environment: env,
        value: `postgres://localhost:5432/${env}_db`,
        description: `Database URL for ${env} environment`,
      });

      // Logging configuration per environment
      await this.setConfig({
        section: 'logging',
        name: 'LOG_LEVEL',
        environment: env,
        value: env === 'production' ? 'error' : 'debug',
        description: `Log level for ${env} environment`,
      });
    }
  }

  private async setConfig(options: {
    section: string;
    name: string;
    environment: string;
    value: string;
    description?: string;
  }) {
    // Implementation would use the underlying services
    // to create sections and data entries
  }
}
```

## 🔌 REST API Endpoints

The module automatically generates REST API endpoints:

### Configuration Sections
- `GET /config/section` - List all sections
- `POST /config/section` - Create a new section
- `GET /config/section/:id` - Get section by ID
- `PUT /config/section/:id` - Update section
- `DELETE /config/section/:id` - Delete section

### Configuration Data
- `GET /config/data` - List all configuration data
- `POST /config/data` - Create new configuration
- `GET /config/data/:id` - Get configuration by ID
- `PUT /config/data/:id` - Update configuration
- `DELETE /config/data/:id` - Delete configuration

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

Sensitive values are automatically encrypted before storage and decrypted when retrieved. You can also encrypt specific values:

```typescript
// Encrypt specific value
await configService.set({
  section: 'api',
  name: 'SECRET_KEY',
  shouldEncrypt: true,
}, 'my-secret-value');

// Retrieve without decryption
const encrypted = await configService.get({
  section: 'api',
  name: 'SECRET_KEY',
  shouldDecrypt: false,
});
```

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

### How do I set up different configurations for different environments?

Use the environment parameter to separate configurations:

```typescript
// Development configuration
await configService.set({
  section: 'api',
  name: 'BASE_URL',
  environment: 'development',
  value: 'http://localhost:3000'
});

// Production configuration
await configService.set({
  section: 'api',
  name: 'BASE_URL', 
  environment: 'production',
  value: 'https://api.myapp.com'
});
```

### Can I extend the functionality with custom business logic?

Yes! The module provides an event-driven architecture with hooks:

```typescript
@Injectable()
export class ConfigAuditListener {
  @OnEvent('config-data.beforeInsert')
  async handleConfigCreate(payload: ConfigDataEventBeforeInsert) {
    // Custom validation, logging, notifications, etc.
    console.log(`Creating config: ${payload.item.name}`);
  }
}
```

### Is this production-ready?

Yes! The module is built with production use in mind:
- **Type-safe** - Full TypeScript support prevents runtime errors
- **Battle-tested** - Built on proven technologies (NestJS, TypeORM)
- **Scalable** - Works with enterprise databases
- **Secure** - Built-in encryption and validation
- **Observable** - Comprehensive logging and monitoring hooks

## 🔒 License
This project is licensed under **MIT License

Copyright (c) 2025 ElsiKora

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.**.