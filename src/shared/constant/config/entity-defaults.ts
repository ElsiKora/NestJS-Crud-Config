/**
 * Default configuration values for entity field lengths and other constraints
 */

// ConfigSection entity defaults
export const CONFIG_SECTION_DEFAULTS = {
	DEFAULT_TABLE_NAME: "config_section",
	MAX_DESCRIPTION_LENGTH: 512,
	MAX_NAME_LENGTH: 128,
} as const;

// ConfigData entity defaults
export const CONFIG_DATA_DEFAULTS = {
	DEFAULT_TABLE_NAME: "config_data",
	MAX_DESCRIPTION_LENGTH: 512,
	MAX_ENVIRONMENT_LENGTH: 64,
	MAX_NAME_LENGTH: 128,
	MAX_VALUE_LENGTH: 8192,
} as const;

// Cache configuration defaults
export const CACHE_DEFAULTS = {
	MAX_CACHE_ITEMS: 100,
	MAX_CACHE_TTL: 300_000, // 5 minutes in milliseconds
} as const;

// Character length constraints for API property validation
export const API_PROPERTY_CONSTRAINTS = {
	MIN_NAME_LENGTH: 1,
	MIN_STRING_LENGTH: 0,
} as const;
