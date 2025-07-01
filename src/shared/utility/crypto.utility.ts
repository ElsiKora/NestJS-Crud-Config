import type { CipherGCM, DecipherGCM } from "node:crypto";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

import { CRYPTO_CONSTANT } from "@shared/constant/crypto.constant";

/**
 * Utility class for encrypting and decrypting configuration values
 * Uses AES-256-GCM for encryption with authentication
 */
export class CryptoUtility {
 /**
  * Decrypts a value encrypted with AES-256-GCM
  * @param {string} encryptedValue - The encrypted value in format: salt:iv:authTag:encryptedData (base64 encoded)
  * @param {string} encryptionKey - The encryption key
  * @returns {string} Decrypted value
  * @throws {Error} If decryption fails or authentication fails
  */
 public static decrypt(encryptedValue: string, encryptionKey: string): string {
  try {
   const combined: Buffer = Buffer.from(encryptedValue, "base64");
   const salt: Buffer = combined.subarray(0, CRYPTO_CONSTANT.SALT_LENGTH);

   const iv: Buffer = combined.subarray(
    CRYPTO_CONSTANT.SALT_LENGTH,
    CRYPTO_CONSTANT.SALT_LENGTH + CRYPTO_CONSTANT.IV_LENGTH,
   );

   const authTag: Buffer = combined.subarray(
    CRYPTO_CONSTANT.SALT_LENGTH + CRYPTO_CONSTANT.IV_LENGTH,
    CRYPTO_CONSTANT.SALT_LENGTH + CRYPTO_CONSTANT.IV_LENGTH + CRYPTO_CONSTANT.TAG_LENGTH,
   );

   const encrypted: Buffer = combined.subarray(
    CRYPTO_CONSTANT.SALT_LENGTH + CRYPTO_CONSTANT.IV_LENGTH + CRYPTO_CONSTANT.TAG_LENGTH,
   );
   const key: Buffer = scryptSync(encryptionKey, salt, CRYPTO_CONSTANT.KEY_LENGTH);

   const decipher: DecipherGCM = createDecipheriv(
    CRYPTO_CONSTANT.ALGORITHM,
    key,
    iv,
   ) as DecipherGCM;

   decipher.setAuthTag(authTag);

   const decrypted: Buffer = Buffer.concat([decipher.update(encrypted), decipher.final()]);

   return decrypted.toString("utf8");
  } catch (error) {
   throw new Error(
    `Failed to decrypt value: ${error instanceof Error ? error.message : "Unknown error"}`,
   );
  }
 }

 /**
  * Encrypts a value using AES-256-GCM
  * @param {string} value - The value to encrypt
  * @param {string} encryptionKey - The encryption key
  * @returns {string} Encrypted value in format: salt:iv:authTag:encryptedData (base64 encoded)
  */
 public static encrypt(value: string, encryptionKey: string): string {
  const salt: Buffer = randomBytes(CRYPTO_CONSTANT.SALT_LENGTH);
  const key: Buffer = scryptSync(encryptionKey, salt, CRYPTO_CONSTANT.KEY_LENGTH);
  const iv: Buffer = randomBytes(CRYPTO_CONSTANT.IV_LENGTH);
  const cipher: CipherGCM = createCipheriv(CRYPTO_CONSTANT.ALGORITHM, key, iv) as CipherGCM;
  const encrypted: Buffer = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag: Buffer = cipher.getAuthTag();
  const combined: Buffer = Buffer.concat([salt, iv, authTag, encrypted]);

  return combined.toString("base64");
 }

 /**
  * Validates if a string is a valid encrypted value
  * @param {string} value - The value to check
  * @returns {boolean} True if the value appears to be encrypted
  */
 public static isEncryptedValue(value: string): boolean {
  try {
   const decoded: Buffer = Buffer.from(value, "base64");

   return (
    decoded.length >=
    CRYPTO_CONSTANT.SALT_LENGTH + CRYPTO_CONSTANT.IV_LENGTH + CRYPTO_CONSTANT.TAG_LENGTH + 1
   );
  } catch {
   return false;
  }
 }
}
