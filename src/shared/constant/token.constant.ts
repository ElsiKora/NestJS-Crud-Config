const CONFIG_SECTION_SERVICE: symbol = Symbol("CRUD_CONFIG_SECTION_SERVICE");
const CONFIG_DATA_SERVICE: symbol = Symbol("CRUD_CONFIG_DATA_SERVICE");
const CONFIG_SECTION_ENTITY: symbol = Symbol("CRUD_CONFIG_SECTION_ENTITY");
const CONFIG_DATA_ENTITY: symbol = Symbol("CRUD_CONFIG_DATA_ENTITY");
const CONFIG_PROPERTIES: symbol = Symbol("CRUD_CONFIG_PROPERTIES");

// eslint-disable-next-line @elsikora/no-secrets/no-pattern-match
export const TOKEN_CONSTANT: {
	readonly CONFIG_DATA_ENTITY: symbol;
	readonly CONFIG_DATA_SERVICE: symbol;
	readonly CONFIG_PROPERTIES: symbol;
	readonly CONFIG_SECTION_ENTITY: symbol;
	readonly CONFIG_SECTION_SERVICE: symbol;
} = {
	CONFIG_DATA_ENTITY,
	CONFIG_DATA_SERVICE,
	CONFIG_PROPERTIES,
	CONFIG_SECTION_ENTITY,
	CONFIG_SECTION_SERVICE,
} as const;
