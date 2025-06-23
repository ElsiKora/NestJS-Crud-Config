import { ConfigSectionModule } from "../section";
import { DynamicModule, Module, ValueProvider } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CRUD_CONFIG_PROPERTIES } from "@shared/constant/config";
import { ICrudConfigProperties } from "@shared/interface/config";

import { ConfigDataController } from "./data.controller";
import { ConfigDataService } from "./data.service";
import { ConfigData } from "./entity/data.entity";
import ConfigDataBeforeInsertListener from "./events/listener/beforeInsert.listener";
import ConfigDataBeforeInsertSubscriber from "./events/subscriber/beforeInsert.subscriber";

@Module({})
export class ConfigDataModule {
	/**
	 * Registers the module with the provided configuration options
	 * @param {ICrudConfigProperties} options - The configuration options
	 * @returns {DynamicModule} The dynamic module configuration
	 */
	public static register(options?: ICrudConfigProperties): DynamicModule {
		// Initialize entity configuration if provided
		if (options) {
			ConfigData.updateEntityOptions(options);
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
		const typeOrmImports = TypeOrmModule.forFeature([ConfigData]);

		return {
			controllers: [ConfigDataController],
			exports: [ConfigDataService],
			imports: [
				typeOrmImports,
				ConfigSectionModule,
				EventEmitterModule.forRoot({
					ignoreErrors: false,
					verboseMemoryLeak: process.env.NODE_ENV !== "production",
				}),
			],
			module: ConfigDataModule,
			providers: [...(propertiesProvider ? [propertiesProvider] : []), ConfigDataService, ConfigDataBeforeInsertSubscriber, ConfigDataBeforeInsertListener],
		};
	}
}
