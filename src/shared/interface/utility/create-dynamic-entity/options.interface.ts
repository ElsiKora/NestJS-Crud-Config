import type { ICreateDynamicEntityRelationOptions } from "@shared/interface";
import type { ColumnOptions } from "typeorm";

export interface ICreateDynamicEntityOptions {
	classDecorators?: Array<ClassDecorator>;
	columns: Record<string, ColumnOptions>;
	decorators?: Record<string, Array<PropertyDecorator>>;
	indexes?: Array<{ columns: Array<string>; name: string }>;
	name: string;
	relations?: Record<string, ICreateDynamicEntityRelationOptions>;
	tableName: string;
	uniques?: Array<Array<string>>;
}
