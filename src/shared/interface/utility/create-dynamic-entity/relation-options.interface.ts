import type { Type } from "@nestjs/common";
import type { RelationOptions } from "typeorm";

export interface ICreateDynamicEntityRelationOptions extends RelationOptions {
 decorator?: { target: Type<unknown> };
 /** Name of the foreign key constraint of the join column. */
 foreignKeyConstraintName?: string;
 hasJoinColumn?: boolean;
 type?: string;
}
