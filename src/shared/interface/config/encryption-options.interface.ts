/**
 * Interface for encryption configuration options
 */
export interface IConfigEncryptionOptions {
 /**
  * The encryption key to use for AES encrypting/decrypting config values
  */
 encryptionKey?: string;

 /**
  * Whether to encrypt sensitive config values (default: false)
  */
 isEnabled?: boolean;
}
