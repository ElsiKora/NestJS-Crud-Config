import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { Test } from "@nestjs/testing";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { TOKEN_CONSTANT } from "../../../../src/shared/constant/token.constant";
import { CryptoUtility } from "../../../../src/shared/utility/crypto.utility";

vi.mock("node:crypto", async (importOriginal) => {
 const actual = await importOriginal<typeof import("node:crypto")>();
 return { ...actual, scryptSync: vi.fn(actual.scryptSync) };
});

// Produced by the unmodified 4.0.0 implementation with salt=0x01 and iv=0x02.
const legacyCiphertext =
 "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQECAgICAgICAgICAgICAgICsIYcoM5yqm82ci8Dt67ddwshX839pWg9YvwYzYJ3ggSkof4=";

function seal(value: string, key: Buffer, salt: Buffer): string {
 const iv = randomBytes(16);
 const cipher = createCipheriv("aes-256-gcm", key, iv);
 const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
 return Buffer.concat([salt, iv, cipher.getAuthTag(), ciphertext]).toString("base64");
}

describe("CryptoUtility", () => {
 let cryptoUtility: CryptoUtility;
 const testKey = "test-encryption-key-32-chars-long";
 const testValue = "This is a test value to encrypt";

 beforeEach(() => {
  cryptoUtility = new CryptoUtility({ encryptionOptions: { derivedKeyCacheMaxEntries: 128 } });
 });

 afterEach(() => {
  cryptoUtility.onModuleDestroy();
  vi.mocked(scryptSync).mockReset();
 });

 describe("encrypt", () => {
  it("should encrypt a value", () => {
   const encrypted = cryptoUtility.encrypt(testValue, testKey);

   expect(encrypted).toBeTruthy();
   expect(encrypted).not.toBe(testValue);
   expect(typeof encrypted).toBe("string");
  });

  it("should produce different encrypted values for same input", () => {
   const encrypted1 = cryptoUtility.encrypt(testValue, testKey);
   const encrypted2 = cryptoUtility.encrypt(testValue, testKey);

   expect(encrypted1).not.toBe(encrypted2);
  });

  it("should handle empty values", () => {
   const encrypted = cryptoUtility.encrypt("", testKey);

   expect(encrypted).toBeTruthy();
  });

  it("should handle unicode values", () => {
   const unicodeValue = "测试值 🔐 тест";
   const encrypted = cryptoUtility.encrypt(unicodeValue, testKey);

   expect(encrypted).toBeTruthy();
  });
 });

 describe("decrypt", () => {
  it("should decrypt an encrypted value", () => {
   const encrypted = cryptoUtility.encrypt(testValue, testKey);
   const decrypted = cryptoUtility.decrypt(encrypted, testKey);

   expect(decrypted).toBe(testValue);
  });

  it("should handle empty encrypted values", () => {
   const encrypted = cryptoUtility.encrypt("", testKey);
   const decrypted = cryptoUtility.decrypt(encrypted, testKey);

   expect(decrypted).toBe("");
  });

  it("should handle unicode values", () => {
   const unicodeValue = "测试值 🔐 тест";
   const encrypted = cryptoUtility.encrypt(unicodeValue, testKey);
   const decrypted = cryptoUtility.decrypt(encrypted, testKey);

   expect(decrypted).toBe(unicodeValue);
  });

  it("should throw error with wrong key", () => {
   const encrypted = cryptoUtility.encrypt(testValue, testKey);
   const wrongKey = "wrong-encryption-key-32-chars-lo";

   expect(() => cryptoUtility.decrypt(encrypted, wrongKey)).toThrow("Failed to decrypt value");
  });

  it("should throw error with invalid encrypted value", () => {
   expect(() => cryptoUtility.decrypt("invalid-encrypted-value", testKey)).toThrow(
    "Failed to decrypt value",
   );
  });

  it("should throw error with corrupted encrypted value", () => {
   const encrypted = cryptoUtility.encrypt(testValue, testKey);
   const corrupted = encrypted.slice(0, -10) + "corrupted";

   expect(() => cryptoUtility.decrypt(corrupted, testKey)).toThrow("Failed to decrypt value");
  });
 });

 describe("isEncryptedValue", () => {
  it("should return true for encrypted values", () => {
   const encrypted = cryptoUtility.encrypt(testValue, testKey);

   expect(cryptoUtility.isEncryptedValue(encrypted)).toBe(true);
  });

  it("should return false for non-encrypted values", () => {
   expect(cryptoUtility.isEncryptedValue("plain text")).toBe(false);
   expect(cryptoUtility.isEncryptedValue("")).toBe(false);
   expect(cryptoUtility.isEncryptedValue("123")).toBe(false);
  });

  it("should return false for invalid base64", () => {
   expect(cryptoUtility.isEncryptedValue("not-base64!@#$%")).toBe(false);
  });

  it("should return false for short base64 values", () => {
   const shortBase64 = Buffer.from("short").toString("base64");
   expect(cryptoUtility.isEncryptedValue(shortBase64)).toBe(false);
  });
 });

 describe("round-trip encryption/decryption", () => {
  it("should handle various data types", () => {
   const testCases = [
    "simple string",
    "string with spaces",
    "string\nwith\nnewlines",
    "string\twith\ttabs",
    JSON.stringify({ key: "value", nested: { data: true } }),
    "1234567890",
    "special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?",
   ];

   testCases.forEach((testCase) => {
    const encrypted = cryptoUtility.encrypt(testCase, testKey);
    const decrypted = cryptoUtility.decrypt(encrypted, testKey);
    expect(decrypted).toBe(testCase);
   });
  });

  it("should handle large values", () => {
   const largeValue = "x".repeat(10000);
   const encrypted = cryptoUtility.encrypt(largeValue, testKey);
   const decrypted = cryptoUtility.decrypt(encrypted, testKey);

   expect(decrypted).toBe(largeValue);
  });
 });

 describe("derived keys", () => {
  it.each([undefined, 0])("does not retain keys when the cache bound is %s", (maximumEntries) => {
   const utility = new CryptoUtility({
    encryptionOptions: { derivedKeyCacheMaxEntries: maximumEntries },
   });
   try {
    expect(utility.decrypt(legacyCiphertext, testKey)).toBe("legacy config value");
    expect(utility.decrypt(legacyCiphertext, testKey)).toBe("legacy config value");
    expect(scryptSync).toHaveBeenCalledTimes(2);
   } finally {
    utility.onModuleDestroy();
   }
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
   "rejects an invalid cache bound (%s)",
   (maximumEntries) => {
    expect(
     () => new CryptoUtility({ encryptionOptions: { derivedKeyCacheMaxEntries: maximumEntries } }),
    ).toThrow(RangeError);
   },
  );

  it("reuses derivation after successful decryption, while encryption alone does not prime it", () => {
   const encrypted = cryptoUtility.encrypt(testValue, testKey);
   const encryptionDerivedKey = vi.mocked(scryptSync).mock.results[0]!.value as Buffer;
   expect(encryptionDerivedKey.every((byte) => byte === 0)).toBe(true);
   expect(scryptSync).toHaveBeenCalledTimes(1);

   expect(cryptoUtility.decrypt(encrypted, testKey)).toBe(testValue);
   expect(cryptoUtility.decrypt(encrypted, testKey)).toBe(testValue);
   expect(scryptSync).toHaveBeenCalledTimes(2);
  });

  it("decrypts the current ciphertext even when the master key and salt are unchanged", () => {
   const salt = Buffer.alloc(32, 1);
   const key = scryptSync(testKey, salt, 32);
   const updatedCiphertext = seal("updated config value", key, salt);
   key.fill(0);
   vi.mocked(scryptSync).mockClear();

   expect(cryptoUtility.decrypt(legacyCiphertext, testKey)).toBe("legacy config value");
   expect(cryptoUtility.decrypt(updatedCiphertext, testKey)).toBe("updated config value");
   expect(scryptSync).toHaveBeenCalledTimes(1);
  });

  it.each([48, 64])(
   "authenticates ciphertext on a warm cache when byte %i is corrupted",
   (offset) => {
    expect(cryptoUtility.decrypt(legacyCiphertext, testKey)).toBe("legacy config value");
    const corrupted = Buffer.from(legacyCiphertext, "base64");
    corrupted[offset] = corrupted[offset]! ^ 1;

    expect(() => cryptoUtility.decrypt(corrupted.toString("base64"), testKey)).toThrow(
     "Failed to decrypt value",
    );
    expect(cryptoUtility.decrypt(legacyCiphertext, testKey)).toBe("legacy config value");
    expect(scryptSync).toHaveBeenCalledTimes(1);
   },
  );

  it("does not retain failed derivations or replace the warm cache on a wrong master key", () => {
   cryptoUtility.decrypt(legacyCiphertext, testKey);
   const retainedKey = vi.mocked(scryptSync).mock.results[0]!.value as Buffer;

   for (let attempt = 0; attempt < 2; attempt += 1) {
    expect(() => cryptoUtility.decrypt(legacyCiphertext, "wrong-master-key")).toThrow(
     "Failed to decrypt value",
    );
    const rejectedKey = vi.mocked(scryptSync).mock.results.at(-1)!.value as Buffer;
    expect(rejectedKey.every((byte) => byte === 0)).toBe(true);
   }

   expect(retainedKey.some((byte) => byte !== 0)).toBe(true);
   expect(cryptoUtility.decrypt(legacyCiphertext, testKey)).toBe("legacy config value");
   expect(scryptSync).toHaveBeenCalledTimes(3);
  });

  it("clears and zeroes old derived keys only after authenticating a different master key", () => {
   const otherMasterKey = "another-master-key";
   const salt = Buffer.alloc(32, 1);
   const key = scryptSync(otherMasterKey, salt, 32);
   const otherCiphertext = seal("new master key value", key, salt);
   key.fill(0);
   vi.mocked(scryptSync).mockClear();

   cryptoUtility.decrypt(legacyCiphertext, testKey);
   const oldKey = vi.mocked(scryptSync).mock.results[0]!.value as Buffer;
   expect(cryptoUtility.decrypt(otherCiphertext, otherMasterKey)).toBe("new master key value");
   expect(oldKey.every((byte) => byte === 0)).toBe(true);
   expect(cryptoUtility.decrypt(otherCiphertext, otherMasterKey)).toBe("new master key value");
   expect(scryptSync).toHaveBeenCalledTimes(2);

   const replacementKey = vi.mocked(scryptSync).mock.results[1]!.value as Buffer;
   expect(cryptoUtility.decrypt(legacyCiphertext, testKey)).toBe("legacy config value");
   expect(replacementKey.every((byte) => byte === 0)).toBe(true);
   expect(scryptSync).toHaveBeenCalledTimes(3);
  });

  it("keeps at most 128 keys, evicts the least recently authenticated salt, and zeroes evicted buffers", () => {
   // Control only the expensive KDF for the capacity test. Every read still runs real AES-GCM.
   vi.mocked(scryptSync).mockImplementation((_password, salt) => Buffer.from(salt as Buffer));
   const ciphertexts = Array.from({ length: 129 }, (_, index) => {
    const salt = Buffer.alloc(32, index + 1);
    return seal(`value ${index}`, salt, salt);
   });

   for (let index = 0; index < 128; index += 1) {
    expect(cryptoUtility.decrypt(ciphertexts[index]!, testKey)).toBe(`value ${index}`);
   }
   const firstKey = vi.mocked(scryptSync).mock.results[0]!.value as Buffer;
   const secondKey = vi.mocked(scryptSync).mock.results[1]!.value as Buffer;
   expect(cryptoUtility.decrypt(ciphertexts[0]!, testKey)).toBe("value 0");

   const corruptedSecond = Buffer.from(ciphertexts[1]!, "base64");
   corruptedSecond[48] = corruptedSecond[48]! ^ 1;
   expect(() => cryptoUtility.decrypt(corruptedSecond.toString("base64"), testKey)).toThrow();

   expect(cryptoUtility.decrypt(ciphertexts[128]!, testKey)).toBe("value 128");
   expect(secondKey.every((byte) => byte === 0)).toBe(true);
   expect(firstKey.some((byte) => byte !== 0)).toBe(true);
   expect(cryptoUtility.decrypt(ciphertexts[0]!, testKey)).toBe("value 0");
   expect(scryptSync).toHaveBeenCalledTimes(129);
   expect(cryptoUtility.decrypt(ciphertexts[1]!, testKey)).toBe("value 1");
   expect(scryptSync).toHaveBeenCalledTimes(130);
  });

  it("zeroes retained keys through the native Nest module destruction hook", async () => {
   const module = await Test.createTestingModule({
    providers: [
     CryptoUtility,
     {
      provide: TOKEN_CONSTANT.CONFIG_OPTIONS,
      useValue: { encryptionOptions: { derivedKeyCacheMaxEntries: 128 } },
     },
    ],
   }).compile();
   try {
    expect(module.get(CryptoUtility).decrypt(legacyCiphertext, testKey)).toBe(
     "legacy config value",
    );
    const retainedKey = vi.mocked(scryptSync).mock.results[0]!.value as Buffer;
    expect(retainedKey.some((byte) => byte !== 0)).toBe(true);
    await module.close();
    expect(retainedKey.every((byte) => byte === 0)).toBe(true);
   } finally {
    await module.close();
   }
  });

  it("preserves the legacy encrypted-value layout and scrypt parameters in both directions", () => {
   expect(cryptoUtility.decrypt(legacyCiphertext, testKey)).toBe("legacy config value");
   expect(scryptSync).toHaveBeenLastCalledWith(testKey, Buffer.alloc(32, 1), 32);

   const combined = Buffer.from(cryptoUtility.encrypt(testValue, testKey), "base64");
   const key = scryptSync(testKey, combined.subarray(0, 32), 32);
   const decipher = createDecipheriv("aes-256-gcm", key, combined.subarray(32, 48));
   decipher.setAuthTag(combined.subarray(48, 64));
   expect(
    Buffer.concat([decipher.update(combined.subarray(64)), decipher.final()]).toString("utf8"),
   ).toBe(testValue);
   key.fill(0);
  });
 });
});
