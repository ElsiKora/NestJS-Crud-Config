const MAX_NAME_LENGTH: number = 128;
const MAX_DESCRIPTION_LENGTH: number = 512;
const DEFAULT_TABLE_NAME: string = "config_section";

export const CONFIG_SECTION_CONSTANT: {
 readonly DEFAULT_TABLE_NAME: string;
 readonly MAX_DESCRIPTION_LENGTH: number;
 readonly MAX_NAME_LENGTH: number;
} = {
 DEFAULT_TABLE_NAME,
 MAX_DESCRIPTION_LENGTH,
 MAX_NAME_LENGTH,
} as const;
