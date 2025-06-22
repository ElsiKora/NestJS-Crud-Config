import type { DynamicModule, Provider, ValueProvider } from "@nestjs/common";
import type { Type } from "@nestjs/common/interfaces";

import { Global, Module } from "@nestjs/common";
import { CRUD_CONFIG_PROPERTIES } from "@shared/constant/config";
import { ICrudConfigAsyncModuleProperties, ICrudConfigProperties, ICrudConfigPropertiesFactory } from "@shared/interface/config";

import { CrudConfigService } from "./config.service";
import { ConfigDataModule } from "./data/data.module";
import { ConfigDataService } from "./data/data.service";
import { ConfigData } from "./data/entity/data.entity";
import { ConfigSection } from "./section/entity/section.entity";
import { ConfigSectionModule } from "./section/section.module";
import { ConfigSectionService } from "./section/section.service";

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
		// Initialize entity configurations
		ConfigSection.updateEntityOptions(options);
		ConfigData.updateEntityOptions(options);

		const propertiesProvider: ValueProvider<ICrudConfigProperties> = {
			provide: CRUD_CONFIG_PROPERTIES,
			useValue: options,
		};

		// We need to include the services in our providers to be able to export them
		return {
			exports: [
				CrudConfigService,
				ConfigSectionModule, // Export modules instead of services directly
				ConfigDataModule,
			],
			imports: [ConfigSectionModule.register(options), ConfigDataModule.register(options)],
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

		// Create dynamic modules for section and data
		const sectionModule = {
			exports: [ConfigSectionService],
			imports: properties.imports || [],
			inject: properties.inject || [],
			module: ConfigSectionModule,
			providers: configPropertiesProviders,
		} as DynamicModule;

		const dataModule = {
			exports: [ConfigDataService],
			imports: properties.imports || [],
			inject: properties.inject || [],
			module: ConfigDataModule,
			providers: configPropertiesProviders,
		} as DynamicModule;

		return {
			exports: [
				CrudConfigService,
				sectionModule, // Export the module reference instead of the service directly
				dataModule, // Export the module reference instead of the service directly
			],
			imports: [...(properties.imports || []), sectionModule, dataModule],
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

					// Apply entity configurations once options are resolved
					ConfigSection.updateEntityOptions(options);
					ConfigData.updateEntityOptions(options);

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

				// Apply entity configurations once options are resolved
				ConfigSection.updateEntityOptions(options);
				ConfigData.updateEntityOptions(options);

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
