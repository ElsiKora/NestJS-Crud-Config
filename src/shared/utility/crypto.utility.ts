import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

/**
 * Utility class for encrypting and decrypting configuration values
 * Uses AES-256-GCM for encryption with authentication
 */
export class CryptoUtility {
	private static readonly ALGORITHM = "aes-256-gcm";
	private static readonly SALT_LENGTH = 32;
	private static readonly IV_LENGTH = 16;
	private static readonly TAG_LENGTH = 16;
	private static readonly KEY_LENGTH = 32;

	/**
	 * Encrypts a value using AES-256-GCM
	 * @param {string} value - The value to encrypt
	 * @param {string} encryptionKey - The encryption key
	 * @returns {string} Encrypted value in format: salt:iv:authTag:encryptedData (base64 encoded)
	 */
	public static encrypt(value: string, encryptionKey: string): string {
		// Generate a random salt for key derivation
		const salt = randomBytes(this.SALT_LENGTH);
		
		// Derive a key from the encryption key using scrypt
		const key = scryptSync(encryptionKey, salt, this.KEY_LENGTH);
		
		// Generate a random initialization vector
		const iv = randomBytes(this.IV_LENGTH);
		
		// Create cipher
		const cipher = createCipheriv(this.ALGORITHM, key, iv);
		
		// Encrypt the value
		const encrypted = Buffer.concat([
			cipher.update(value, "utf8"),
			cipher.final(),
		]);
		
		// Get the authentication tag
		const authTag = cipher.getAuthTag();
		
		// Combine salt, iv, authTag, and encrypted data
		const combined = Buffer.concat([salt, iv, authTag, encrypted]);
		
		// Return base64 encoded string
		return combined.toString("base64");
	}

	/**
	 * Decrypts a value encrypted with AES-256-GCM
	 * @param {string} encryptedValue - The encrypted value in format: salt:iv:authTag:encryptedData (base64 encoded)
	 * @param {string} encryptionKey - The encryption key
	 * @returns {string} Decrypted value
	 * @throws {Error} If decryption fails or authentication fails
	 */
	public static decrypt(encryptedValue: string, encryptionKey: string): string {
		try {
			// Decode from base64
			const combined = Buffer.from(encryptedValue, "base64");
			
			// Extract components
			const salt = combined.subarray(0, this.SALT_LENGTH);
			const iv = combined.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
			const authTag = combined.subarray(
				this.SALT_LENGTH + this.IV_LENGTH,
				this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH
			);
			const encrypted = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
			
			// Derive the key from the encryption key using the same salt
			const key = scryptSync(encryptionKey, salt, this.KEY_LENGTH);
			
			// Create decipher
			const decipher = createDecipheriv(this.ALGORITHM, key, iv);
			decipher.setAuthTag(authTag);
			
			// Decrypt the value
			const decrypted = Buffer.concat([
				decipher.update(encrypted),
				decipher.final(),
			]);
			
			return decrypted.toString("utf8");
		} catch (error) {
			throw new Error(`Failed to decrypt value: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	}

	/**
	 * Validates if a string is a valid encrypted value
	 * @param {string} value - The value to check
	 * @returns {boolean} True if the value appears to be encrypted
	 */
	public static isEncryptedValue(value: string): boolean {
		try {
			const decoded = Buffer.from(value, "base64");
			// Minimum length: salt (32) + iv (16) + tag (16) + at least 1 byte of data
			return decoded.length >= this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH + 1;
		} catch {
			return false;
		}
	}
} 