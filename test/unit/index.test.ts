import { describe, expect, it } from "vitest";

describe("index", () => {
 it("should export all necessary modules", async () => {
  const indexExports = await import("../../src/index");
  
  // Check that main modules are exported
  expect(indexExports).toHaveProperty("CrudConfigModule");
  expect(indexExports).toHaveProperty("CrudConfigService");
  
  // Check that shared exports are available
  expect(indexExports).toHaveProperty("TOKEN_CONSTANT");
  expect(indexExports).toHaveProperty("CONFIG_DATA_CONSTANT");
  expect(indexExports).toHaveProperty("CONFIG_SECTION_CONSTANT");
  expect(indexExports).toHaveProperty("CRYPTO_CONSTANT");
  
  // Check enums
  expect(indexExports).toHaveProperty("EEnvironment");
  expect(indexExports).toHaveProperty("EInstanceName");
  expect(indexExports).toHaveProperty("EService");
  
  // Check utilities
  expect(indexExports).toHaveProperty("CryptoUtility");
  expect(indexExports).toHaveProperty("createDynamicEntityClass");
  expect(indexExports).toHaveProperty("createDynamicService");
  expect(indexExports).toHaveProperty("createDynamicEntityUtility");
 });
}); 