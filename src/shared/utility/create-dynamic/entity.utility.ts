import type { IApiBaseEntity } from "@elsikora/nestjs-crud-automator";
import type {
 ICreateDynamicEntityOptions,
 ICreateDynamicEntityRelationOptions,
} from "@shared/interface";
import type { TDynamicEntity } from "@shared/type";
import type { TableOptions } from "typeorm";

import { JoinColumn, ManyToOne } from "typeorm";
import { Column, getMetadataArgsStorage } from "typeorm";
import { PrimaryGeneratedColumn } from "typeorm";
import { Index } from "typeorm";
import { Unique } from "typeorm";
import { Entity } from "typeorm";

type TColumnMetadataArguments = ReturnType<typeof getMetadataArgsStorage>["columns"][number];

/**
 * Creates a dynamic entity class with TypeORM decorators
 * This approach allows full customization of table names and properties at runtime.
 * A TypeORM column decorator in `decorators`, such as `CreateDateColumn`, sets the column's mode; the property's
 * `columns` options are merged into it instead of registering a plain column that TypeORM would keep first.
 * @see {@link https://elsikora.com/docs/nestjs-crud-config/api-reference/utilities/create-dynamic-entity-class | API Reference - createDynamicEntityClass}
 * @param {ICreateDynamicEntityOptions} options Configuration options for the dynamic entity
 * @returns {TDynamicEntity<unknown>} Dynamically created entity class with all decorators applied
 */
export function createDynamicEntityClass<T extends IApiBaseEntity = IApiBaseEntity>(
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
  if (decorators[propertyKey]) {
   for (const decorator of decorators[propertyKey]) {
    // eslint-disable-next-line @elsikora/typescript/no-unsafe-argument
    decorator(DynamicEntity.prototype, propertyKey);
   }
  }

  // TypeORM keeps the first column registered for a property, so a column decorator such as CreateDateColumn sets the
  // mode and the column options are merged into it instead of registering a plain column ahead of it
  const storedColumns: Array<TColumnMetadataArguments> = getMetadataArgsStorage().columns;

  const decoratedIndex: number = storedColumns.findIndex(
   (column: TColumnMetadataArguments) =>
    column.target === DynamicEntity && column.propertyName === propertyKey,
  );
  const decoratedColumn: TColumnMetadataArguments | undefined = storedColumns[decoratedIndex];

  if (decoratedColumn) {
   storedColumns[decoratedIndex] = {
    ...decoratedColumn,
    options: { ...columnOptions, ...decoratedColumn.options },
   };
  } else {
   // eslint-disable-next-line @elsikora/typescript/no-unsafe-argument
   Column(columnOptions)(DynamicEntity.prototype, propertyKey);
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
