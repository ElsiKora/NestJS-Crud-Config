import type { CipherGCM, DecipherGCM } from "node:crypto";

import type { OnModuleDestroy } from "@nestjs/common";
import type { IConfigOptions } from "@shared/interface/config/options.interface";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

import { Inject, Injectable, Optional } from "@nestjs/common";
import { CRYPTO_CONSTANT } from "@shared/constant/crypto.constant";
import { TOKEN_CONSTANT } from "@shared/constant/token.constant";
import { LRUCache } from "lru-cache";

/**
 * Utility class for encrypting and decrypting configuration values
 * Uses AES-256-GCM for encryption with authentication
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/core-concepts/encryption | Core Concepts - Encryption}
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/utilities/crypto-utility | API Reference - CryptoUtility}
 */
@Injectable()
export class CryptoUtility implements OnModuleDestroy {
 private currentEncryptionKey: string | undefined;

 private readonly DERIVED_KEY_CACHE: LRUCache<string, Buffer> | undefined;

 public constructor(@Inject(TOKEN_CONSTANT.CONFIG_OPTIONS) @Optional() options?: IConfigOptions) {
  const maximumEntries: number = options?.encryptionOptions?.derivedKeyCacheMaxEntries ?? 0;

  if (maximumEntries < 0 || !Number.isSafeInteger(maximumEntries)) {
   throw new RangeError("derivedKeyCacheMaxEntries must be a non-negative safe integer");
  }

  if (maximumEntries > 0) {
   this.DERIVED_KEY_CACHE = new LRUCache<string, Buffer>({
    dispose: (value: Buffer): void => {
     value.fill(0);
    },
    max: maximumEntries,
   });
  }
 }

 /**
  * Decrypts a value encrypted with AES-256-GCM
  * @param {string} encryptedValue - The encrypted value in format: salt:iv:authTag:encryptedData (base64 encoded)
  * @param {string} encryptionKey - The encryption key
  * @returns {string} Decrypted value
  * @throws {Error} If decryption fails or authentication fails
  */
 public decrypt(encryptedValue: string, encryptionKey: string): string {
  let uncachedKey: Buffer | undefined;

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
   const saltIdentity: string = salt.toString("base64");

   const cachedKey: Buffer | undefined =
    encryptionKey === this.currentEncryptionKey
     ? this.DERIVED_KEY_CACHE?.peek(saltIdentity)
     : undefined;
   const key: Buffer = cachedKey ?? scryptSync(encryptionKey, salt, CRYPTO_CONSTANT.KEY_LENGTH);

   if (!cachedKey) uncachedKey = key;

   const decipher: DecipherGCM = createDecipheriv(
    CRYPTO_CONSTANT.ALGORITHM,
    key,
    iv,
   ) as DecipherGCM;

   decipher.setAuthTag(authTag);

   const decrypted: Buffer = Buffer.concat([decipher.update(encrypted), decipher.final()]);

   if (this.DERIVED_KEY_CACHE) {
    if (encryptionKey !== this.currentEncryptionKey) {
     this.clearKeys();
     this.currentEncryptionKey = encryptionKey;
    }

    if (cachedKey) {
     this.DERIVED_KEY_CACHE.get(saltIdentity);
    } else {
     this.DERIVED_KEY_CACHE.set(saltIdentity, key);
     uncachedKey = undefined;
    }
   }

   return decrypted.toString("utf8");
  } catch (error: unknown) {
   const decryptionError: { cause?: unknown } & Error = new Error(
    `Failed to decrypt value: ${error instanceof Error ? error.message : "Unknown error"}`,
   );
   decryptionError.cause = error;

   throw decryptionError;
  } finally {
   uncachedKey?.fill(0);
  }
 }

 /**
  * Encrypts a value using AES-256-GCM
  * @param {string} value - The value to encrypt
  * @param {string} encryptionKey - The encryption key
  * @returns {string} Encrypted value in format: salt:iv:authTag:encryptedData (base64 encoded)
  */
 public encrypt(value: string, encryptionKey: string): string {
  const salt: Buffer = randomBytes(CRYPTO_CONSTANT.SALT_LENGTH);
  const key: Buffer = scryptSync(encryptionKey, salt, CRYPTO_CONSTANT.KEY_LENGTH);

  try {
   const iv: Buffer = randomBytes(CRYPTO_CONSTANT.IV_LENGTH);
   const cipher: CipherGCM = createCipheriv(CRYPTO_CONSTANT.ALGORITHM, key, iv) as CipherGCM;
   const encrypted: Buffer = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
   const authTag: Buffer = cipher.getAuthTag();
   const combined: Buffer = Buffer.concat([salt, iv, authTag, encrypted]);

   return combined.toString("base64");
  } finally {
   key.fill(0);
  }
 }

 /**
  * Validates if a string is a valid encrypted value
  * @param {string} value - The value to check
  * @returns {boolean} True if the value appears to be encrypted
  */
 public isEncryptedValue(value: string): boolean {
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

 /** Releases retained derived keys when the owning Nest module closes. */
 public onModuleDestroy(): void {
  this.clearKeys();
 }

 private clearKeys(): void {
  this.DERIVED_KEY_CACHE?.clear();
  this.currentEncryptionKey = undefined;
 }
}
