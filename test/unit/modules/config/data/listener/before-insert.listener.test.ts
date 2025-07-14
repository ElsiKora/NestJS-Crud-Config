import { describe, expect, it, vi, beforeEach } from "vitest";
import { ConfigDataBeforeInsertListener } from "../../../../../../src/modules/config/data/listener";
import { ConfigDataEventBeforeInsert } from "../../../../../../src/modules/config/data/event";
import { ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import { ConflictException, NotFoundException } from "@nestjs/common";

describe("ConfigDataBeforeInsertListener", () => {
 let listener: ConfigDataBeforeInsertListener;
 let mockService: any;

 beforeEach(() => {
  vi.clearAllMocks();
  mockService = {
   get: vi.fn(),
  };
  
  listener = new ConfigDataBeforeInsertListener(mockService);
 });

 it("should return success if no duplicate is found", async () => {
  mockService.get.mockResolvedValue(null);
  
  const event = new ConfigDataEventBeforeInsert();
  event.item = {
   name: "test-config",
   value: "test-value",
   environment: "test",
  } as any;
  event.eventManager = {} as any;

  const result = await listener.handleBeforeInsert(event);

  expect(result).toEqual({ isSuccess: true });
  expect(mockService.get).toHaveBeenCalledWith(
   {
    where: {
     environment: "test",
     name: "test-config",
    },
   },
   event.eventManager,
  );
 });

 it("should return error if duplicate is found", async () => {
  mockService.get.mockResolvedValue({
   id: 1,
   name: "test-config",
   environment: "test",
  });
  
  const event = new ConfigDataEventBeforeInsert();
  event.item = {
   name: "test-config",
   value: "test-value",
   environment: "test",
  } as any;
  event.eventManager = {} as any;

  const result = await listener.handleBeforeInsert(event);

  expect(result.isSuccess).toBe(false);
  expect(result.error).toBeInstanceOf(ConflictException);
  expect((result.error as ConflictException).message).toBe("ConfigData with this environment and name already exists");
 });

 it("should return success if NotFoundException is thrown", async () => {
  mockService.get.mockRejectedValue(new NotFoundException());
  
  const event = new ConfigDataEventBeforeInsert();
  event.item = {
   name: "test-config",
   value: "test-value",
   environment: "test",
  } as any;
  event.eventManager = {} as any;

  const result = await listener.handleBeforeInsert(event);

  expect(result).toEqual({ isSuccess: true });
 });

 it("should return error for other exceptions", async () => {
  const error = new Error("Database error");
  mockService.get.mockRejectedValue(error);
  
  const event = new ConfigDataEventBeforeInsert();
  event.item = {
   name: "test-config",
   value: "test-value",
   environment: "test",
  } as any;
  event.eventManager = {} as any;

  const result = await listener.handleBeforeInsert(event);

  expect(result).toEqual({ error, isSuccess: false });
 });
}); 