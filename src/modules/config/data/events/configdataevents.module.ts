// Note: This module is designed to work with dynamic entities
// The actual entity types and services will be determined at runtime
import { ConfigDataController } from "@modules/config/data/data.controller";
import { ConfigDataService } from "@modules/config/data/data.service";
import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";

import ConfigDataBeforeInsertListener from "./listener/beforeInsert.listener";
import ConfigDataBeforeInsertSubscriber from "./subscriber/beforeInsert.subscriber";

/**
 * Configdataevents module with event system integration
 */
@Module({
	controllers: [ConfigDataController],
	exports: [ConfigDataService],
	imports: [
		// Note: Dynamic entities will be registered at runtime
		// TypeOrmModule.forFeature() will be configured dynamically
		// Register EventEmitterModule if not already registered in the app module
		EventEmitterModule.forRoot({
			// Configure other options as needed
			ignoreErrors: false,
			// Set this to false in production for better performance
			verboseMemoryLeak: process.env.NODE_ENV !== "production",
		}),
	],
	providers: [
		ConfigDataService,
		// Register all subscribers
		ConfigDataBeforeInsertSubscriber,
		// Register all listeners
		ConfigDataBeforeInsertListener,
	],
})
export default class ConfigDataEventsModule {}
