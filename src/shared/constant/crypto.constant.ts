const ALGORITHM: string = "aes-256-gcm";
const IV_LENGTH: number = 16;
const KEY_LENGTH: number = 32;
const SALT_LENGTH: number = 32;
const TAG_LENGTH: number = 16;

export const CRYPTO_CONSTANT: {
 readonly ALGORITHM: string;
 readonly IV_LENGTH: number;
 readonly KEY_LENGTH: number;
 readonly SALT_LENGTH: number;
 readonly TAG_LENGTH: number;
} = {
 ALGORITHM,
 IV_LENGTH,
 KEY_LENGTH,
 SALT_LENGTH,
 TAG_LENGTH,
} as const;
