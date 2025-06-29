/**
 * Default configuration values for entity field lengths and other constraints
 */

// Magic number constants
const SMALL_STRING_LENGTH: number = 64;
const MEDIUM_STRING_LENGTH: number = 128;
const LARGE_STRING_LENGTH: number = 512;
const EXTRA_LARGE_STRING_LENGTH: number = 8192;
const DEFAULT_CACHE_ITEMS: number = 100;
const FIVE_MINUTES_IN_MS: number = 300_000;

// ConfigSection entity defaults
export const CONFIG_SECTION_DEFAULTS: {
	readonly DEFAULT_TABLE_NAME: string;
	readonly MAX_DESCRIPTION_LENGTH: number;
	readonly MAX_NAME_LENGTH: number;
} = {
	DEFAULT_TABLE_NAME: "config_section",
	MAX_DESCRIPTION_LENGTH: LARGE_STRING_LENGTH,
	MAX_NAME_LENGTH: MEDIUM_STRING_LENGTH,
} as const;

// ConfigData entity defaults
export const CONFIG_DATA_DEFAULTS: {
	readonly DEFAULT_TABLE_NAME: string;
	readonly MAX_DESCRIPTION_LENGTH: number;
	readonly MAX_ENVIRONMENT_LENGTH: number;
	readonly MAX_NAME_LENGTH: number;
	readonly MAX_VALUE_LENGTH: number;
} = {
	DEFAULT_TABLE_NAME: "config_data",
	MAX_DESCRIPTION_LENGTH: LARGE_STRING_LENGTH,
	MAX_ENVIRONMENT_LENGTH: SMALL_STRING_LENGTH,
	MAX_NAME_LENGTH: MEDIUM_STRING_LENGTH,
	MAX_VALUE_LENGTH: EXTRA_LARGE_STRING_LENGTH,
} as const;

// Cache configuration defaults
export const CACHE_DEFAULTS: {
	readonly MAX_CACHE_ITEMS: number;
	readonly MAX_CACHE_TTL: number;
} = {
	MAX_CACHE_ITEMS: DEFAULT_CACHE_ITEMS,
	MAX_CACHE_TTL: FIVE_MINUTES_IN_MS, // 5 minutes in milliseconds
} as const;

// Character length constraints for API property validation
export const API_PROPERTY_CONSTRAINTS: {
	readonly MIN_NAME_LENGTH: number;
	readonly MIN_STRING_LENGTH: number;
} = {
	MIN_NAME_LENGTH: 1,
	MIN_STRING_LENGTH: 0,
} as const;
