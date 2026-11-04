import type { ICreateDynamicEntityRelationOptions } from "@shared/interface";
import type { ColumnOptions } from "typeorm";

export interface ICreateDynamicEntityOptions {
 classDecorators?: Array<ClassDecorator>;
 columns: Record<string, ColumnOptions>;
 /**
  * Property decorators, applied before the column. A TypeORM column decorator among them, such as `CreateDateColumn`,
  * sets the column's mode, and the property's `columns` options are merged into it, its own options winning.
  */
 decorators?: Record<string, Array<PropertyDecorator>>;
 indexes?: Array<{ columns: Array<string>; name: string }>;
 name: string;
 /** Name of the primary key constraint of the generated `id` column; a declared `id` column names its own. */
 primaryKeyConstraintName?: string;
 relations?: Record<string, ICreateDynamicEntityRelationOptions>;
 tableName: string;
 uniques?: Array<{ columns: Array<string>; name: string }>;
}
