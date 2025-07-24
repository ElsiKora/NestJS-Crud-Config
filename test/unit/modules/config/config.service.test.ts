import { ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import { HttpException, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrudConfigService } from "../../../../src/modules/config/config.service";
import { IConfigData } from "../../../../src/modules/config/data";
import { IConfigSection } from "../../../../src/modules/config/section";
import { IConfigOptions } from "../../../../src/shared/interface/config";
import { CryptoUtility } from "../../../../src/shared/utility";
import { DataSource } from "typeorm";

describe("CrudConfigService", () => {
 let service: CrudConfigService;
 let sectionService: ApiServiceBase<IConfigSection>;
 let dataService: ApiServiceBase<IConfigData>;
 let cacheManager: any;
 let configOptions: IConfigOptions;
 let cryptoUtility: CryptoUtility;
 let dataSource: DataSource;

 const mockSection: IConfigSection = {
  id: "section-1",
  name: "test-section",
  description: "Test section",
  createdAt: new Date(),
  updatedAt: new Date(),
 };

 const mockConfigData: IConfigData = {
  id: "data-1",
  name: "test-config",
  value: "test-value",
  environment: "default",
  description: "Test config",
  isEncrypted: false,
  section: mockSection,
  createdAt: new Date(),
  updatedAt: new Date(),
 };

 beforeEach(async () => {
  vi.clearAllMocks();

  sectionService = {
   get: vi.fn().mockResolvedValue(mockSection),
   getList: vi.fn(),
   create: vi.fn().mockResolvedValue(mockSection),
   update: vi.fn(),
   delete: vi.fn(),
  } as any;

  dataService = {
   get: vi.fn().mockResolvedValue(mockConfigData),
   getList: vi.fn().mockResolvedValue({ items: [mockConfigData], total: 1 }),
   create: vi.fn().mockResolvedValue(mockConfigData),
   update: vi.fn().mockResolvedValue(mockConfigData),
   delete: vi.fn().mockResolvedValue(undefined),
  } as any;

  cacheManager = {
   get: vi.fn(),
   set: vi.fn(),
   del: vi.fn(),
   wrap: vi.fn(),
  } as any;

  cryptoUtility = {
   encrypt: vi.fn(),
   decrypt: vi.fn(),
   isEncryptedValue: vi.fn(),
  } as any;

  const queryRunner = {
   connect: vi.fn(),
   startTransaction: vi.fn(),
   commitTransaction: vi.fn(),
   rollbackTransaction: vi.fn(),
   release: vi.fn(),
   manager: {},
  };

  dataSource = {
   createQueryRunner: vi.fn().mockReturnValue(queryRunner),
  } as any;

  configOptions = {
   environment: "test",
   shouldAutoCreateSections: false,
   cacheOptions: {
    isEnabled: true,
    maxCacheItems: 100,
    maxCacheTTL: 3600000,
   },
   encryptionOptions: {
    isEnabled: false,
    encryptionKey: "test-encryption-key-32-chars-long",
   },
  };

  service = new CrudConfigService(
   sectionService,
   dataService,
   cacheManager,
   configOptions,
   dataSource,
   cryptoUtility,
  );
 });

 describe("get", () => {
  it("should get configuration value", async () => {
   const result = await service.get({
    section: "test-section",
    name: "test-config",
   });

   expect(result).toEqual(mockConfigData);
   expect(sectionService.get).toHaveBeenCalledWith({ where: { name: "test-section" } }, undefined);
   expect(dataService.get).toHaveBeenCalled();
  });

  it("should use cache when enabled", async () => {
   vi.mocked(cacheManager.get).mockResolvedValueOnce(mockConfigData);

   const result = await service.get({
    section: "test-section",
    name: "test-config",
    useCache: true,
   });

   expect(result).toEqual(mockConfigData);
   expect(cacheManager.get).toHaveBeenCalledWith("config:test-section:test-config:test");
   expect(dataService.get).not.toHaveBeenCalled();
  });

  it("should decrypt encrypted values", async () => {
   const encryptedValue = "encrypted-value";
   const decryptedValue = "decrypted-value";
   const encryptedData = { ...mockConfigData, value: encryptedValue, isEncrypted: true };

   vi.mocked(dataService.get).mockResolvedValueOnce(encryptedData);
   vi.mocked(cryptoUtility.decrypt).mockReturnValue(decryptedValue);

   configOptions.encryptionOptions!.isEnabled = true;

   const result = await service.get({
    section: "test-section",
    name: "test-config",
   });

   expect(result.value).toBe(decryptedValue);
   expect(cryptoUtility.decrypt).toHaveBeenCalledWith(
    encryptedValue,
    configOptions.encryptionOptions!.encryptionKey,
   );
  });

  it("should throw error when decryption key is missing", async () => {
   const encryptedData = { ...mockConfigData, isEncrypted: true };
   vi.mocked(dataService.get).mockResolvedValueOnce(encryptedData);

   configOptions.encryptionOptions!.encryptionKey = undefined as any;

   await expect(
    service.get({
     section: "test-section",
     name: "test-config",
    }),
   ).rejects.toThrow(InternalServerErrorException);
  });

  it("should throw error when CryptoUtility is not available", async () => {
   const encryptedData = { ...mockConfigData, isEncrypted: true };
   vi.mocked(dataService.get).mockResolvedValueOnce(encryptedData);

   service = new CrudConfigService(
    sectionService,
    dataService,
    cacheManager,
    configOptions,
    dataSource,
    undefined,
   );

   await expect(
    service.get({
     section: "test-section",
     name: "test-config",
    }),
   ).rejects.toThrow(InternalServerErrorException);
  });

  it("should not auto-create section when shouldAutoCreateSections is enabled", async () => {
   configOptions.shouldAutoCreateSections = true;
   vi.mocked(sectionService.get).mockRejectedValueOnce(new NotFoundException());

   await expect(
    service.get({
     section: "new-section",
     name: "test-config",
    }),
   ).rejects.toThrow(NotFoundException);

   expect(sectionService.create).not.toHaveBeenCalled();
  });

  it("should not auto-create section when shouldAutoCreateSections is disabled", async () => {
   configOptions.shouldAutoCreateSections = false;
   vi.mocked(sectionService.get).mockRejectedValueOnce(new NotFoundException());

   await expect(
    service.get({
     section: "new-section",
     name: "test-config",
    }),
   ).rejects.toThrow(NotFoundException);

   expect(sectionService.create).not.toHaveBeenCalled();
  });

  it("should handle custom environment", async () => {
   await service.get({
    section: "test-section",
    name: "test-config",
    environment: "production",
   });

   expect(dataService.get).toHaveBeenCalledWith(
    expect.objectContaining({
     where: expect.objectContaining({
      environment: "production",
     }),
    }),
    undefined,
   );
  });

  it("should load section info when requested", async () => {
   await service.get({
    section: "test-section",
    name: "test-config",
    shouldLoadSectionInfo: true,
   });

   expect(dataService.get).toHaveBeenCalledWith(
    expect.objectContaining({
     relations: { section: true },
    }),
    undefined,
   );
  });
 });

 describe("set", () => {
  it("should create new configuration", async () => {
   vi.mocked(dataService.get).mockRejectedValueOnce(new NotFoundException());

   const result = await service.set({
    section: "test-section",
    name: "new-config",
    value: "new-value",
    description: "New config",
   });

   expect(result).toEqual(mockConfigData);
   expect(dataService.create).toHaveBeenCalled();
   expect(cacheManager.del).toHaveBeenCalledTimes(2);
  });

  it("should update existing configuration", async () => {
   const result = await service.set({
    section: "test-section",
    name: "test-config",
    value: "updated-value",
   });

   expect(result).toEqual(mockConfigData);
   expect(dataService.update).toHaveBeenCalled();
   expect(cacheManager.del).toHaveBeenCalledTimes(2);
  });

  it("should encrypt value when encryption is enabled", async () => {
   const encryptedValue = "encrypted-value";
   vi.mocked(cryptoUtility.encrypt).mockReturnValue(encryptedValue);

   configOptions.encryptionOptions!.isEnabled = true;

   await service.set({
    section: "test-section",
    name: "test-config",
    value: "plain-value",
   });

   expect(cryptoUtility.encrypt).toHaveBeenCalledWith(
    "plain-value",
    configOptions.encryptionOptions!.encryptionKey,
   );
   expect(dataService.update).toHaveBeenCalledWith(
    { id: "data-1" },
    expect.objectContaining({
     value: encryptedValue,
     isEncrypted: true,
    }),
    expect.any(Object),
   );
  });

  it("should throw error when encryption key is missing", async () => {
   configOptions.encryptionOptions!.isEnabled = true;
   configOptions.encryptionOptions!.encryptionKey = undefined as any;

   await expect(
    service.set({
     section: "test-section",
     name: "test-config",
     value: "test-value",
    }),
   ).rejects.toThrow(InternalServerErrorException);
  });

  it("should throw error when CryptoUtility is not available", async () => {
   configOptions.encryptionOptions!.isEnabled = true;

   service = new CrudConfigService(
    sectionService,
    dataService,
    cacheManager,
    configOptions,
    dataSource,
    undefined,
   );

   await expect(
    service.set({
     section: "test-section",
     name: "test-config",
     value: "test-value",
    }),
   ).rejects.toThrow(InternalServerErrorException);
  });

  it("should handle encryption errors", async () => {
   configOptions.encryptionOptions!.isEnabled = true;
   vi.mocked(cryptoUtility.encrypt).mockImplementation(() => {
    throw new Error("Encryption failed");
   });

   await expect(
    service.set({
     section: "test-section",
     name: "test-config",
     value: "test-value",
    }),
   ).rejects.toThrow(InternalServerErrorException);
  });

  it("should create transaction when eventManager is not provided", async () => {
   const queryRunner = dataSource.createQueryRunner();

   await service.set({
    section: "test-section",
    name: "test-config",
    value: "test-value",
   });

   expect(dataSource.createQueryRunner).toHaveBeenCalled();
   expect(queryRunner.connect).toHaveBeenCalled();
   expect(queryRunner.startTransaction).toHaveBeenCalled();
   expect(queryRunner.commitTransaction).toHaveBeenCalled();
   expect(queryRunner.release).toHaveBeenCalled();
  });

  it("should auto-create section when shouldAutoCreateSections is enabled", async () => {
   configOptions.shouldAutoCreateSections = true;
   vi.mocked(sectionService.get).mockRejectedValueOnce(new NotFoundException());

   await service.set({
    section: "new-section",
    name: "test-config",
    value: "test-value",
   });

   expect(sectionService.create).toHaveBeenCalledWith({ name: "new-section" }, expect.any(Object));
  });

  it("should not auto-create section when shouldAutoCreateSections is disabled", async () => {
   configOptions.shouldAutoCreateSections = false;
   vi.mocked(sectionService.get).mockRejectedValueOnce(new NotFoundException());

   await expect(
    service.set({
     section: "new-section",
     name: "test-config",
     value: "test-value",
    }),
   ).rejects.toThrow(NotFoundException);

   expect(sectionService.create).not.toHaveBeenCalled();
  });

  it("should rollback transaction on error", async () => {
   const queryRunner = dataSource.createQueryRunner();
   vi.mocked(dataService.get).mockRejectedValueOnce(new Error("Database error"));

   await expect(
    service.set({
     section: "test-section",
     name: "test-config",
     value: "test-value",
    }),
   ).rejects.toThrow(InternalServerErrorException);

   expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
   expect(queryRunner.release).toHaveBeenCalled();
  });
 });

 describe("delete", () => {
  it("should delete configuration", async () => {
   await service.delete({
    section: "test-section",
    name: "test-config",
   });

   expect(dataService.delete).toHaveBeenCalledWith({ id: "data-1" }, undefined);
   expect(cacheManager.del).toHaveBeenCalledTimes(2);
  });

  it("should not auto-create section when shouldAutoCreateSections is enabled", async () => {
   configOptions.shouldAutoCreateSections = true;
   vi.mocked(sectionService.get).mockRejectedValueOnce(new NotFoundException());

   await expect(
    service.delete({
     section: "new-section",
     name: "test-config",
    }),
   ).rejects.toThrow(NotFoundException);

   expect(sectionService.create).not.toHaveBeenCalled();
  });

  it("should use custom environment", async () => {
   await service.delete({
    section: "test-section",
    name: "test-config",
    environment: "production",
   });

   expect(dataService.get).toHaveBeenCalledWith(
    expect.objectContaining({
     where: expect.objectContaining({
      environment: "production",
     }),
    }),
    undefined,
   );
  });

  it("should handle not found errors", async () => {
   vi.mocked(sectionService.get).mockRejectedValueOnce(new NotFoundException());

   await expect(
    service.delete({
     section: "non-existent",
     name: "test-config",
    }),
   ).rejects.toThrow(NotFoundException);
  });

  it("should handle generic errors", async () => {
   vi.mocked(dataService.delete).mockRejectedValueOnce(new Error("Database error"));

   await expect(
    service.delete({
     section: "test-section",
     name: "test-config",
    }),
   ).rejects.toThrow(InternalServerErrorException);
  });
 });

 describe("getList", () => {
  it("should get list of configurations", async () => {
   const result = await service.getList({
    section: "test-section",
   });

   expect(result).toEqual([mockConfigData]);
   expect(sectionService.get).toHaveBeenCalledWith({ where: { name: "test-section" } }, undefined);
   expect(dataService.getList).toHaveBeenCalled();
  });

  it("should use cache when enabled", async () => {
   vi.mocked(cacheManager.get).mockResolvedValueOnce([mockConfigData]);

   const result = await service.getList({
    section: "test-section",
    useCache: true,
   });

   expect(result).toEqual([mockConfigData]);
   expect(cacheManager.get).toHaveBeenCalledWith("config:list:test-section:test");
   expect(dataService.getList).not.toHaveBeenCalled();
  });

  it("should cache results when cache is enabled", async () => {
   vi.mocked(cacheManager.get).mockResolvedValueOnce(undefined);

   await service.getList({
    section: "test-section",
    useCache: true,
   });

   expect(cacheManager.set).toHaveBeenCalledWith(
    "config:list:test-section:test",
    [mockConfigData],
    configOptions.cacheOptions!.maxCacheTTL,
   );
  });

  it("should not auto-create section when shouldAutoCreateSections is enabled", async () => {
   configOptions.shouldAutoCreateSections = true;
   vi.mocked(sectionService.get).mockRejectedValueOnce(new NotFoundException());

   await expect(
    service.getList({
     section: "new-section",
    }),
   ).rejects.toThrow(NotFoundException);

   expect(sectionService.create).not.toHaveBeenCalled();
  });

  it("should handle custom environment", async () => {
   await service.getList({
    section: "test-section",
    environment: "production",
   });

   expect(dataService.getList).toHaveBeenCalledWith(
    expect.objectContaining({
     where: expect.objectContaining({
      environment: "production",
     }),
    }),
    undefined,
   );
  });

  it("should handle errors", async () => {
   vi.mocked(sectionService.get).mockRejectedValueOnce(new Error("Database error"));

   await expect(
    service.getList({
     section: "test-section",
    }),
   ).rejects.toThrow(InternalServerErrorException);
  });
 });

 describe("getOrCreateSection", () => {
  it("should return existing section", async () => {
   // Access private method for testing
   const result = await (service as any).getOrCreateSection("test-section");

   expect(result).toEqual(mockSection);
   expect(sectionService.get).toHaveBeenCalledWith({ where: { name: "test-section" } }, undefined);
   expect(sectionService.create).not.toHaveBeenCalled();
  });

  it("should create new section when shouldAutoCreateSections is enabled", async () => {
   configOptions.shouldAutoCreateSections = true;
   vi.mocked(sectionService.get).mockRejectedValueOnce(new NotFoundException());

   const result = await (service as any).getOrCreateSection("new-section");

   expect(sectionService.create).toHaveBeenCalledWith({ name: "new-section" }, undefined);
   expect(result).toEqual(mockSection);
  });

  it("should throw error when section not found and shouldAutoCreateSections is disabled", async () => {
   configOptions.shouldAutoCreateSections = false;
   vi.mocked(sectionService.get).mockRejectedValueOnce(new NotFoundException());

   await expect((service as any).getOrCreateSection("new-section")).rejects.toThrow(
    NotFoundException,
   );

   expect(sectionService.create).not.toHaveBeenCalled();
  });

  it("should propagate non-NotFound errors", async () => {
   vi.mocked(sectionService.get).mockRejectedValueOnce(new Error("Database error"));

   await expect((service as any).getOrCreateSection("test-section")).rejects.toThrow(
    "Database error",
   );

   expect(sectionService.create).not.toHaveBeenCalled();
  });
 });
});
