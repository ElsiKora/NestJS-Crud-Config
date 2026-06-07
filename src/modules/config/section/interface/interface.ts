import type { IApiBaseEntity } from "@elsikora/nestjs-crud-automator";

export interface IConfigSection extends IApiBaseEntity {
 createdAt: Date;
 description: string;
 id: string;
 name: string;
 updatedAt: Date;
}
