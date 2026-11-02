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
 relations?: Record<string, ICreateDynamicEntityRelationOptions>;
 tableName: string;
 uniques?: Array<Array<string>>;
}
