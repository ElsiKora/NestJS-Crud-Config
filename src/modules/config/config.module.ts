import type { DynamicModule, Provider, ValueProvider } from "@nestjs/common";
import type { Type } from "@nestjs/common/interfaces";

import { CacheModule } from "@nestjs/cache-manager";
import { Global, Module } from "@nestjs/common";
import { CRUD_CONFIG_PROPERTIES } from "@shared/constant/config";
import { ICrudConfigAsyncModuleProperties, ICrudConfigProperties, ICrudConfigPropertiesFactory } from "@shared/interface/config";

import { CrudConfigService } from "./config.service";
// Dynamic entity imports will be handled by CrudConfigFullDynamicModule

@Global()
@Module({})
export class CrudConfigModule {
	/**
	 * Registers the module with the provided configuration options
	 * Reuses the existing database connection in the parent application
	 * @param {ICrudConfigProperties} options - The configuration options
	 * @returns {DynamicModule} The dynamic module configuration
	 */
	public static register(options: ICrudConfigProperties): DynamicModule {
		// Entity configurations are now handled in CrudConfigFullDynamicModule

		const propertiesProvider: ValueProvider<ICrudConfigProperties> = {
			provide: CRUD_CONFIG_PROPERTIES,
			useValue: options,
		};

		const imports: Array<DynamicModule> = [];

		if (options.cacheOptions?.isEnabled) {
			imports.push(
				CacheModule.register({
					max: options.cacheOptions.maxCacheItems,
					ttl: options.cacheOptions.maxCacheTTL,
				}),
			);
		}

		// We need to include the services in our providers to be able to export them
		return {
			exports: [
				CrudConfigService,
			],
			imports,
			module: CrudConfigModule,
			providers: [propertiesProvider, CrudConfigService],
		};
	}

	/**
	 * Registers the module asynchronously with dynamic configuration
	 * Reuses the existing database connection in the parent application
	 * @param {ICrudConfigAsyncModuleProperties} properties - The async module properties
	 * @returns {DynamicModule} The dynamic module configuration
	 */
	public static registerAsync(properties: ICrudConfigAsyncModuleProperties): DynamicModule {
		const providers: Array<Provider> = this.createAsyncProviders(properties);

		// Find config properties provider
		const configPropertiesProviders = providers.filter((p) => {
			return typeof p === "object" && p !== null && "provide" in p && p.provide === CRUD_CONFIG_PROPERTIES;
		});

		// Dynamic modules are handled in CrudConfigFullDynamicModule

		return {
			exports: [
				CrudConfigService,
			],
			imports: [...(properties.imports || [])],
			module: CrudConfigModule,
			providers,
		};
	}

	/**
	 * Creates async options provider for the module
	 * @param {ICrudConfigAsyncModuleProperties} properties - The async module properties
	 * @returns {Provider} The provider
	 * @private
	 */
	private static createAsyncOptionsProvider(properties: ICrudConfigAsyncModuleProperties): Provider {
		if (properties.useFactory) {
			const originalFactory = properties.useFactory;

			return {
				inject: properties.inject || [],
				provide: CRUD_CONFIG_PROPERTIES,
				useFactory: async (...arguments_: Array<any>): Promise<ICrudConfigProperties> => {
					const options = await originalFactory(...arguments_);

					// Entity configurations are now handled in CrudConfigFullDynamicModule

					return options;
				},
			};
		}

		const inject: Type<ICrudConfigPropertiesFactory> | undefined = properties.useExisting || properties.useClass;

		return {
			inject: inject ? [inject] : [],
			provide: CRUD_CONFIG_PROPERTIES,
			useFactory: async (optionsFactory: ICrudConfigPropertiesFactory): Promise<ICrudConfigProperties> => {
				const options = await optionsFactory.createOptions();

				// Entity configurations are now handled in CrudConfigFullDynamicModule

				return options;
			},
		};
	}

	/**
	 * Creates all providers needed for async module registration
	 * @param {ICrudConfigAsyncModuleProperties} properties - The async module properties
	 * @returns {Array<Provider>} The array of providers
	 * @private
	 */
	private static createAsyncProviders(properties: ICrudConfigAsyncModuleProperties): Array<Provider> {
		const optionsProvider: Provider = this.createAsyncOptionsProvider(properties);
		const providers: Array<Provider> = [optionsProvider, CrudConfigService];

		if (properties.useClass && !properties.useExisting) {
			providers.push({
				provide: properties.useClass,
				useClass: properties.useClass,
			});
		}

		return providers;
	}
}
