export interface ICreateDynamicEntityOptions {
	classDecorators?: Array<ClassDecorator>;
	columns: Record<string, any>;
	decorators?: Record<string, Array<PropertyDecorator>>;
	indexes?: Array<{ columns: Array<string>; name: string }>;
	name: string;
	relations?: Record<string, any>;
	tableName: string;
	uniques?: Array<Array<string>>;
}
