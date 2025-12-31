import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ImportJob } from "../../entities/import-job.entity";

@Injectable()
export class ImportsService {
  constructor(@InjectRepository(ImportJob) private readonly jobs: Repository<ImportJob>) {}

  async getJob(tenantId: string, id: string) {
    const job = await this.jobs.findOne({ where: { tenantId, id } });
    if (!job) throw new NotFoundException("Import job not found");
    return job;
  }
}

