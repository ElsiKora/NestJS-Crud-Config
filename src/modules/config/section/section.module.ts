import { ConfigSection } from "@modules/config/section/entity/section.entity";
import ConfigSectionController from "@modules/config/section/section.controller";
import { ConfigSectionService } from "@modules/config/section/section.service";
import { DynamicModule, Module, ValueProvider } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CRUD_CONFIG_PROPERTIES } from "@shared/constant/config";
import { ICrudConfigProperties } from "@shared/interface/config";

@Module({})
export class ConfigSectionModule {
	/**
	 * Registers the module with the provided configuration options
	 * @param {ICrudConfigProperties} options - The configuration options
	 * @returns {DynamicModule} The dynamic module configuration
	 */
	public static register(options?: ICrudConfigProperties): DynamicModule {
		// Initialize entity configuration if provided
		if (options) {
			ConfigSection.updateEntityOptions(options);
		}

		const propertiesProvider: undefined | ValueProvider<ICrudConfigProperties> = options
			? {
					provide: CRUD_CONFIG_PROPERTIES,
					useValue: options,
				}
			: undefined;

		// The tableName is updated in the entity via updateEntityOptions,
		// but TypeORM only reads it during Entity definition time, not runtime.
		// For runtime table name changes, we would need to use a different approach
		// with EntitySchema or custom DataSource configuration.
		const typeOrmImports = TypeOrmModule.forFeature([ConfigSection]);

		return {
			controllers: [ConfigSectionController],
			exports: [ConfigSectionService],
			imports: [typeOrmImports],
			module: ConfigSectionModule,
			providers: [...(propertiesProvider ? [propertiesProvider] : []), ConfigSectionService],
		};
	}
}
