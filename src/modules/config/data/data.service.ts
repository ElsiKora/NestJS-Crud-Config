import { ApiService, ApiServiceBase } from "@elsikora/nestjs-crud-automator";
import { ConfigData } from "@modules/config/data/entity/data.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@ApiService({ entity: ConfigData })
@Injectable()
export class ConfigDataService extends ApiServiceBase<ConfigData> {
	constructor(
		@InjectRepository(ConfigData)
		private readonly repository: Repository<ConfigData>,
	) {
		super();
		void this.repository;
	}
}
