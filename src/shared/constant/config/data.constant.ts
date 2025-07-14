const MAX_ENVIRONMENT_LENGTH: number = 64;
const MAX_NAME_LENGTH: number = 128;
const MAX_DESCRIPTION_LENGTH: number = 512;
const MAX_VALUE_LENGTH: number = 8192;
const DEFAULT_TABLE_NAME: string = "config_data";

export const CONFIG_DATA_CONSTANT: {
 readonly DEFAULT_TABLE_NAME: string;
 readonly MAX_DESCRIPTION_LENGTH: number;
 readonly MAX_ENVIRONMENT_LENGTH: number;
 readonly MAX_NAME_LENGTH: number;
 readonly MAX_VALUE_LENGTH: number;
} = {
 DEFAULT_TABLE_NAME,
 MAX_DESCRIPTION_LENGTH,
 MAX_ENVIRONMENT_LENGTH,
 MAX_NAME_LENGTH,
 MAX_VALUE_LENGTH,
} as const;
