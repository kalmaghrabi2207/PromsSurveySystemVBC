import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tenant } from "../../entities/tenant.entity";

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private readonly tenants: Repository<Tenant>) {}

  async getById(id: string) {
    const t = await this.tenants.findOne({ where: { id } });
    if (!t) throw new NotFoundException("Tenant not found");
    return t;
  }
}

