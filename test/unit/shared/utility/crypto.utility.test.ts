import { describe, expect, it, beforeEach } from "vitest";
import { CryptoUtility } from "../../../../src/shared/utility/crypto.utility";

describe("CryptoUtility", () => {
 let cryptoUtility: CryptoUtility;
 const testKey = "test-encryption-key-32-chars-long";
 const testValue = "This is a test value to encrypt";

 beforeEach(() => {
  cryptoUtility = new CryptoUtility();
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
    "Failed to decrypt value"
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
}); 