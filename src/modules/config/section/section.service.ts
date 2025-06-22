import { ApiService, ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import { ConfigSection } from "@modules/config/section/entity/section.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@ApiService({ entity: ConfigSection })
@Injectable()
export class ConfigSectionService extends ApiServiceBase<ConfigSection> {
	constructor(
		@InjectRepository(ConfigSection)
		private readonly repository: Repository<ConfigSection>,
	) {
		super();
		void this.repository;
	}
}
