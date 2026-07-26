import type { Type } from "@nestjs/common";
import type { RelationOptions } from "typeorm";

export interface ICreateDynamicEntityRelationOptions extends RelationOptions {
 decorator?: { target: Type<unknown> };
 hasJoinColumn?: boolean;
 type?: string;
}
