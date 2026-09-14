/**
 * Interface for encryption configuration options
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/interfaces/config-encryption-options | API Reference - IConfigEncryptionOptions}
 */
export interface IConfigEncryptionOptions {
 /**
  * Maximum number of derived encryption keys retained in memory for successful
  * decryptions. A value of `0` or `undefined` disables this optimization.
  */
 derivedKeyCacheMaxEntries?: number;

 /**
  * The encryption key to use for AES encrypting/decrypting config values
  */
 encryptionKey?: string;

 /**
  * Whether to encrypt sensitive config values (default: false)
  */
 isEnabled?: boolean;
}
