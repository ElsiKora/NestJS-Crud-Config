import type { IApiBaseEntity } from "@elsikora/nestjs-crud-automator";
import type { IConfigSection } from "@modules/config/section";

export interface IConfigData extends IApiBaseEntity {
 createdAt: Date;
 description: string;
 environment: string;
 id: string;
 isEncrypted: boolean;
 name: string;
 section: IConfigSection | Partial<IConfigSection>;
 updatedAt: Date;
 value: string;
}
