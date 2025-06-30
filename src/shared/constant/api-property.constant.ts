const MIN_NAME_LENGTH: number = 1;
const MIN_STRING_LENGTH: number = 1;

export const API_PROPERTY_CONSTANT: {
	readonly MIN_NAME_LENGTH: number;
	readonly MIN_STRING_LENGTH: number;
} = {
	MIN_NAME_LENGTH,
	MIN_STRING_LENGTH,
} as const;
