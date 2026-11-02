import { Column, CreateDateColumn, getMetadataArgsStorage, Index, UpdateDateColumn } from "typeorm";
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
  const mockDecorator: PropertyDecorator = () => {};

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
  const classDecorator: ClassDecorator = () => {};

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
 it("should let a column decorator set the column mode and merge the column options into it", () => {
  const timestampOptions = {
   default: () => "CURRENT_TIMESTAMP",
   nullable: false,
   type: Date,
  } as const;
  const DynamicEntity = createDynamicEntityClass({
   columns: {
    createdAt: timestampOptions,
    label: { type: "varchar" },
    updatedAt: timestampOptions,
   },
   decorators: {
    createdAt: [CreateDateColumn({ type: Date })],
    updatedAt: [UpdateDateColumn({ precision: null, type: Date })],
   },
   name: "DatedEntity",
   tableName: "dated_table",
  });
  const columns = getMetadataArgsStorage().columns.filter(
   (column) => column.target === DynamicEntity,
  );
  const byProperty = (propertyName: string) =>
   columns.filter((column) => column.propertyName === propertyName);

  expect(byProperty("createdAt")).toHaveLength(1);
  expect(byProperty("createdAt")[0]?.mode).toBe("createDate");
  expect(byProperty("createdAt")[0]?.options).toEqual({ ...timestampOptions, type: Date });
  expect(byProperty("updatedAt")).toHaveLength(1);
  expect(byProperty("updatedAt")[0]?.mode).toBe("updateDate");
  expect(byProperty("updatedAt")[0]?.options).toEqual({ ...timestampOptions, precision: null });
  expect(byProperty("label")).toHaveLength(1);
  expect(byProperty("label")[0]?.mode).toBe("regular");
 });

 it("should let a Column in decorators win over the columns options it shares", () => {
  const DynamicEntity = createDynamicEntityClass({
   columns: {
    slug: { length: 64, nullable: false, type: "varchar" },
    title: { length: 128, type: "varchar" },
   },
   decorators: {
    slug: [Column({ length: 128, type: "varchar" })],
    title: [Index()],
   },
   name: "DecoratedColumnEntity",
   tableName: "decorated_column_table",
  });
  const columns = getMetadataArgsStorage().columns.filter(
   (column) => column.target === DynamicEntity,
  );
  const byProperty = (propertyName: string) =>
   columns.filter((column) => column.propertyName === propertyName);

  expect(byProperty("slug")).toHaveLength(1);
  expect(byProperty("slug")[0]?.options).toEqual({ length: 128, nullable: false, type: "varchar" });
  expect(byProperty("title")).toHaveLength(1);
  expect(byProperty("title")[0]?.options).toEqual({ length: 128, type: "varchar" });
 });
});
