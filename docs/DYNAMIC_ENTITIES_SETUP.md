# Dynamic Entities Setup Guide

This guide explains how to properly set up the NestJS CRUD Config module with dynamic entities.

## Important: TypeORM Configuration

When using dynamic entities, you MUST configure TypeORM to include the dynamic entities. The module provides a static method to get the entities:

```typescript
import { TypeOrmModule } from "@nestjs/typeorm";
import { CrudConfigFullDynamicModule } from "@modules/config";

// First, register the CrudConfigFullDynamicModule to initialize entities
const configOptions = {
	entityOptions: {
		tablePrefix: "app_",
		configSection: {
			tableName: "config_sections",
			maxNameLength: 255,
			maxDescriptionLength: 1000,
		},
		configData: {
			tableName: "config_data",
			maxNameLength: 255,
			maxValueLength: 10000,
			maxEnvironmentLength: 50,
			maxDescriptionLength: 1000,
		},
	},
};

// Initialize the module first (this creates the entities)
CrudConfigFullDynamicModule.register(configOptions);

// Then use the entities in TypeORM configuration
@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: "postgres",
			host: "localhost",
			port: 5432,
			username: "user",
			password: "password",
			database: "mydb",
			entities: [
				...CrudConfigFullDynamicModule.getEntities(), // Add dynamic entities
				// ... your other entities
			],
			synchronize: true,
		}),
		CrudConfigFullDynamicModule.register(configOptions), // Register the module
	],
})
export class AppModule {}
```

## Alternative: Using Entity Getter Function

If you need to configure TypeORM before the module is registered, use a getter function:

```typescript
@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useFactory: () => {
				// Initialize entities first
				const configOptions = {
					entityOptions: {
						tablePrefix: "app_",
						// ... your config
					},
				};

				// This initializes the entities internally
				CrudConfigFullDynamicModule.register(configOptions);

				return {
					type: "postgres",
					host: "localhost",
					port: 5432,
					username: "user",
					password: "password",
					database: "mydb",
					entities: [
						...CrudConfigFullDynamicModule.getEntities(),
						// ... your other entities
					],
					synchronize: true,
				};
			},
		}),
		CrudConfigFullDynamicModule.register({
			// Same config as above
		}),
	],
})
export class AppModule {}
```

## Common Errors and Solutions

### Error: "Nest can't resolve dependencies of the DynamicConfigSectionService"

This error occurs when TypeORM doesn't know about the dynamic entities. Make sure:

1. You call `CrudConfigFullDynamicModule.register()` before `getEntities()`
2. The dynamic entities are included in your TypeORM `entities` array
3. You're using the same configuration options in both places

### Error: "CrudConfigFullDynamicModule must be registered before accessing entities"

This error means you're trying to call `getEntities()` before registering the module. Always register first:

```typescript
// ❌ Wrong
const entities = CrudConfigFullDynamicModule.getEntities();
CrudConfigFullDynamicModule.register(options);

// ✅ Correct
CrudConfigFullDynamicModule.register(options);
const entities = CrudConfigFullDynamicModule.getEntities();
```

## Module Variants

The package provides three module variants:

1. **CrudConfigFullDynamicModule** - Full support with ApiPropertyDescribe decorators
2. **CrudConfigDynamicModule** - Dynamic entities without API documentation
3. **CrudConfigSimpleDynamicModule** - Basic dynamic entities without decorators

Choose based on your needs. All variants require the same TypeORM setup.
