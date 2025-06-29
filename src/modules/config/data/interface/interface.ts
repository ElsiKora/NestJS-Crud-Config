import type { IConfigSection } from "@modules/config/section";

export interface IConfigData {
	createdAt: Date;
	description: string;
	environment: string;
	id: string;
	isEncrypted: boolean;
	name: string;
	section: IConfigSection;
	updatedAt: Date;
	value: string;
}
