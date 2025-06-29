import type { Type } from "@nestjs/common";
import type { ColumnOptions, RelationOptions } from "typeorm";

export interface ICreateDynamicEntityOptions {
	classDecorators?: Array<ClassDecorator>;
	columns: Record<string, ColumnOptions>;
	decorators?: Record<string, Array<PropertyDecorator>>;
	indexes?: Array<{ columns: Array<string>; name: string }>;
	name: string;
	relations?: Record<string, IExtendedRelationOptions>;
	tableName: string;
	uniques?: Array<Array<string>>;
}
