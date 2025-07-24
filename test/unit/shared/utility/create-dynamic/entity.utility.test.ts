import { describe, expect, it } from "vitest";
import { createDynamicEntityClass } from "../../../../../src/shared/utility/create-dynamic/entity.utility";

describe("createDynamicEntityClass", () => {
 it("should create a basic entity class", () => {
  const DynamicEntity = createDynamicEntityClass({
   name: "TestEntity",
   tableName: "test_table",
   columns: {
    name: {
     type: "varchar",
     length: 255,
    },
   },
  });

  expect(DynamicEntity).toBeDefined();
  expect(DynamicEntity.name).toBe("TestEntity");

  const instance = new DynamicEntity();
  expect(instance).toBeDefined();
  expect(instance.constructor.name).toBe("TestEntity");
 });

 it("should handle columns with decorators", () => {
  const mockDecorator = (target: any, propertyKey: string) => {};

  const DynamicEntity = createDynamicEntityClass({
   name: "DecoratedEntity",
   tableName: "decorated_table",
   columns: {
    email: {
     type: "varchar",
     length: 255,
    },
   },
   decorators: {
    email: [mockDecorator],
   },
  });

  expect(DynamicEntity).toBeDefined();
  const instance = new DynamicEntity();
  expect(instance).toBeDefined();
  expect(DynamicEntity.name).toBe("DecoratedEntity");
 });

 it("should handle class decorators", () => {
  const classDecorator = (target: any) => {};

  const DynamicEntity = createDynamicEntityClass({
   name: "ClassDecoratedEntity",
   tableName: "class_decorated_table",
   columns: {
    value: {
     type: "int",
    },
   },
   classDecorators: [classDecorator],
  });

  expect(DynamicEntity).toBeDefined();
 });

 it("should handle unique constraints", () => {
  const DynamicEntity = createDynamicEntityClass({
   name: "UniqueEntity",
   tableName: "unique_table",
   columns: {
    email: {
     type: "varchar",
     length: 255,
    },
    username: {
     type: "varchar",
     length: 100,
    },
   },
   uniques: [["email"], ["username"]],
  });

  expect(DynamicEntity).toBeDefined();
 });

 it("should handle indexes", () => {
  const DynamicEntity = createDynamicEntityClass({
   name: "IndexedEntity",
   tableName: "indexed_table",
   columns: {
    name: {
     type: "varchar",
     length: 255,
    },
    status: {
     type: "varchar",
     length: 50,
    },
   },
   indexes: [
    {
     name: "IDX_NAME",
     columns: ["name"],
    },
    {
     name: "IDX_STATUS",
     columns: ["status"],
    },
   ],
  });

  expect(DynamicEntity).toBeDefined();
 });

 it("should handle ManyToOne relations", () => {
  const TargetEntity = class Target {};

  const DynamicEntity = createDynamicEntityClass({
   name: "RelatedEntity",
   tableName: "related_table",
   columns: {
    title: {
     type: "varchar",
     length: 255,
    },
   },
   relations: {
    target: {
     type: "ManyToOne",
     decorator: {
      target: TargetEntity,
     },
    },
   },
  });

  expect(DynamicEntity).toBeDefined();
  const instance = new DynamicEntity();
  expect(instance).toBeDefined();
  expect(DynamicEntity.name).toBe("RelatedEntity");
 });

 it("should handle custom primary column", () => {
  const DynamicEntity = createDynamicEntityClass({
   name: "CustomPrimaryEntity",
   tableName: "custom_primary_table",
   columns: {
    id: {
     type: "int",
     primary: true,
     generated: "increment",
    },
    name: {
     type: "varchar",
     length: 255,
    },
   },
  });

  expect(DynamicEntity).toBeDefined();
  const instance = new DynamicEntity();
  expect(instance).toBeDefined();
  expect(DynamicEntity.name).toBe("CustomPrimaryEntity");
 });
});
