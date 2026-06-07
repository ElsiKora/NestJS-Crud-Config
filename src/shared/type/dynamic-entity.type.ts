import type { IApiBaseEntity } from "@elsikora/nestjs-crud-automator";

export type TDynamicEntity<T extends IApiBaseEntity = IApiBaseEntity> = new (
 ...arguments_: Array<unknown>
) => T;
