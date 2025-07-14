import type {
 ICreateDynamicEntityOptions,
 ICreateDynamicEntityRelationOptions,
} from "@shared/interface";
import type { TDynamicEntity } from "@shared/type";
import type { TableOptions } from "typeorm";

import { JoinColumn, ManyToOne } from "typeorm";
import { Column } from "typeorm";
import { PrimaryGeneratedColumn } from "typeorm";
import { Index } from "typeorm";
import { Unique } from "typeorm";
import { Entity } from "typeorm";

/**
 * Creates a dynamic entity class with TypeORM decorators
 * This approach allows full customization of table names and properties at runtime
 * @param {ICreateDynamicEntityOptions} options Configuration options for the dynamic entity
 * @returns {TDynamicEntity<unknown>} Dynamically created entity class with all decorators applied
 */
export function createDynamicEntityClass<T = unknown>(
 options: ICreateDynamicEntityOptions,
): TDynamicEntity<T> {
 const {
  classDecorators = [],
  columns,
  decorators = {},
  indexes = [],
  name,
  relations = {},
  tableName,
  uniques = [],
 }: ICreateDynamicEntityOptions = options;

 const DynamicEntity: TDynamicEntity = class {};

 Object.defineProperty(DynamicEntity, "name", { value: name });

 const entityOptions: TableOptions = { name: tableName };
 Entity(entityOptions)(DynamicEntity);

 for (const decorator of classDecorators) decorator(DynamicEntity);

 for (const uniqueColumns of uniques) {
  Unique(uniqueColumns)(DynamicEntity);
 }

 for (const index of indexes) {
  Index(index.name, index.columns)(DynamicEntity);
 }

 if (!columns.id) {
  // eslint-disable-next-line @elsikora/typescript/no-unsafe-argument
  PrimaryGeneratedColumn("uuid")(DynamicEntity.prototype, "id");

  if (decorators.id) {
   // eslint-disable-next-line @elsikora/typescript/no-unsafe-argument
   for (const decorator of decorators.id) decorator(DynamicEntity.prototype, "id");
  }
 }

 for (const [propertyKey, columnOptions] of Object.entries(columns)) {
  // eslint-disable-next-line @elsikora/typescript/no-unsafe-argument
  Column(columnOptions)(DynamicEntity.prototype, propertyKey);

  if (decorators[propertyKey]) {
   for (const decorator of decorators[propertyKey]) {
    // eslint-disable-next-line @elsikora/typescript/no-unsafe-argument
    decorator(DynamicEntity.prototype, propertyKey);
   }
  }
 }

 for (const [propertyKey, relationOptions] of Object.entries(relations)) {
  const extendedOptions: ICreateDynamicEntityRelationOptions = relationOptions;
  const { decorator, type, ...options }: ICreateDynamicEntityRelationOptions = extendedOptions;

  if (type === "ManyToOne" && decorator) {
   // eslint-disable-next-line @elsikora/typescript/no-unsafe-argument
   ManyToOne(() => decorator.target, options)(DynamicEntity.prototype, propertyKey);

   if (options.hasJoinColumn !== false) {
    // eslint-disable-next-line @elsikora/typescript/no-unsafe-argument
    JoinColumn()(DynamicEntity.prototype, propertyKey);
   }
  }

  if (decorators[propertyKey]) {
   for (const decorator of decorators[propertyKey]) {
    // eslint-disable-next-line @elsikora/typescript/no-unsafe-argument
    decorator(DynamicEntity.prototype, propertyKey);
   }
  }
 }

 return DynamicEntity as TDynamicEntity<T>;
}
