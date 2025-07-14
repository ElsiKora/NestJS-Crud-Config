import { describe, expect, it } from "vitest";
import { createDynamicEntityClass } from "../../../../src/shared/utility/create-dynamic-entity.utility";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

describe("createDynamicEntityClass", () => {
  it("should create a basic dynamic entity", () => {
   const DynamicEntity = createDynamicEntityClass({
    name: "TestEntity",
    tableName: "test_entity",
    columns: {
     name: {
      type: "varchar",
      length: 255,
      nullable: false,
     },
     description: {
      type: "text",
      nullable: true,
     },
    },
   });

   expect(DynamicEntity).toBeDefined();
   expect(DynamicEntity.name).toBe("TestEntity");

   // Properties are added via decorators, not as instance properties
   const instance = new DynamicEntity();
   expect(instance).toBeDefined();
   expect(instance.constructor.name).toBe("TestEntity");
  });

  it("should create entity with basic columns", () => {
   const DynamicEntity = createDynamicEntityClass({
    name: "CustomPrimaryEntity",
    tableName: "custom_primary",
    columns: {
     id: {
      type: "int",
      primary: true,
      generated: "increment",
     },
     title: {
      type: "varchar",
      length: 100,
     },
    },
   });

   const instance = new DynamicEntity();
   expect(instance).toBeDefined();
   expect(instance.constructor.name).toBe("CustomPrimaryEntity");
  });

  it("should create entity with relations", () => {
   const CategoryEntity = createDynamicEntityClass({
    name: "Category",
    tableName: "categories",
    columns: {
     name: {
      type: "varchar",
      length: 100,
     },
    },
   });

   const ProductEntity = createDynamicEntityClass({
    name: "Product",
    tableName: "products",
    columns: {
     name: {
      type: "varchar",
      length: 255,
     },
     price: {
      type: "decimal",
      precision: 10,
      scale: 2,
     },
    },
    relations: [
     {
      propertyName: "category",
      type: "many-to-one",
      target: CategoryEntity,
      inverseSide: "products",
      joinColumn: {
       name: "category_id",
      },
     },
    ],
   });

   const instance = new ProductEntity();
   expect(instance).toBeDefined();
   expect(instance.constructor.name).toBe("Product");
   // Properties are defined via decorators, not as instance properties
  });

  it("should create entity with indexes", () => {
   const DynamicEntity = createDynamicEntityClass({
    name: "IndexedEntity",
    tableName: "indexed_entity",
    columns: {
     email: {
      type: "varchar",
      length: 255,
      unique: true,
     },
     status: {
      type: "varchar",
      length: 50,
     },
    },
    indexes: [
     {
      name: "IDX_STATUS",
      columns: ["status"],
     },
    ],
   });

   expect(DynamicEntity).toBeDefined();
   const instance = new DynamicEntity();
   expect(instance).toBeDefined();
   expect(instance.constructor.name).toBe("IndexedEntity");
  });

  it("should create entity with enum column", () => {
   const DynamicEntity = createDynamicEntityClass({
    name: "EnumEntity",
    tableName: "enum_entity",
    columns: {
     role: {
      type: "enum",
      enum: ["admin", "user", "guest"],
      default: "user",
     },
    },
   });

   const instance = new DynamicEntity();
   expect(instance).toBeDefined();
   expect(DynamicEntity.name).toBe("EnumEntity");
  });

  it("should create entity with timestamp columns", () => {
   const DynamicEntity = createDynamicEntityClass({
    name: "TimestampEntity",
    tableName: "timestamp_entity",
    columns: {
     name: {
      type: "varchar",
      length: 100,
     },
    },
    timestamps: {
     createDate: true,
     updateDate: true,
     deleteDate: true,
    },
   });

   const instance = new DynamicEntity();
   expect(instance).toBeDefined();
   expect(DynamicEntity.name).toBe("TimestampEntity");
  });

  it("should create entity with one-to-many relation", () => {
   const UserEntity = createDynamicEntityClass({
    name: "User",
    tableName: "users",
    columns: {
     username: {
      type: "varchar",
      length: 100,
     },
    },
   });

   const PostEntity = createDynamicEntityClass({
    name: "Post",
    tableName: "posts",
    columns: {
     title: {
      type: "varchar",
      length: 255,
     },
    },
    relations: [
     {
      propertyName: "author",
      type: "many-to-one",
      target: UserEntity,
      inverseSide: "posts",
     },
    ],
   });

   const UserWithPostsEntity = createDynamicEntityClass({
    name: "UserWithPosts",
    tableName: "users",
    columns: {
     username: {
      type: "varchar",
      length: 100,
     },
    },
    relations: [
     {
      propertyName: "posts",
      type: "one-to-many",
      target: PostEntity,
      inverseSide: "author",
     },
    ],
   });

   const userInstance = new UserWithPostsEntity();
   expect(userInstance).toBeDefined();
   expect(UserWithPostsEntity.name).toBe("UserWithPosts");
  });

  it("should create entity with API property decorators", () => {
   const DynamicEntity = createDynamicEntityClass({
    name: "ApiEntity",
    tableName: "api_entity",
    columns: {
     title: {
      type: "varchar",
      length: 255,
      apiPropertyOptions: {
       description: "The title of the entity",
       example: "Example Title",
       required: true,
      },
     },
     count: {
      type: "int",
      apiPropertyOptions: {
       description: "Count value",
       example: 42,
       minimum: 0,
       maximum: 100,
      },
     },
    },
   });

   expect(DynamicEntity).toBeDefined();
   const instance = new DynamicEntity();
   expect(instance).toBeDefined();
   expect(DynamicEntity.name).toBe("ApiEntity");
  });

  it("should handle column with default values", () => {
   const DynamicEntity = createDynamicEntityClass({
    name: "DefaultValueEntity",
    tableName: "default_values",
    columns: {
     status: {
      type: "varchar",
      length: 50,
      default: "pending",
     },
     isActive: {
      type: "boolean",
      default: true,
     },
     score: {
      type: "int",
      default: 0,
     },
    },
   });

   const instance = new DynamicEntity();
   expect(instance).toBeDefined();
  });
}); 