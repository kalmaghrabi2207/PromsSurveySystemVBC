import { Body, Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { memoryStorage } from "multer";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequireTenantGuard } from "../../common/tenant/require-tenant.guard";
import { TenantId } from "../../common/tenant/tenant.decorator";
import { ImportJob } from "../../entities/import-job.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StartImportDto } from "./dto/start-import.dto";

@ApiTags("imports")
@ApiBearerAuth()
@Controller("imports")
export class ImportsController {
  constructor(
    @InjectRepository(ImportJob) private readonly jobs: Repository<ImportJob>,
    @InjectQueue("imports") private readonly importsQueue: Queue
  ) {}

  @UseGuards(JwtAuthGuard, RequireTenantGuard)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }))
  @Post("question-bank")
  async start(
    @TenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: StartImportDto
  ) {
    if (!file) throw new Error("file is required");
    const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
    fs.mkdirSync(uploadDir, { recursive: true });
    const id = randomUUID();
    const storagePath = path.join(uploadDir, `${id}-${file.originalname}`);
    fs.writeFileSync(storagePath, file.buffer);

    const job = await this.jobs.save({
      id,
      tenantId,
      sourceType: dto.sourceType,
      mode: dto.mode,
      status: "queued",
      originalFilename: file.originalname,
      storagePath,
      reportJson: {},
      normalizedJson: {},
      error: null,
      completedAt: null
    });

    await this.importsQueue.add("import-question-bank", { tenantId, importJobId: job.id });
    return { importJobId: job.id, status: job.status };
  }

  @UseGuards(JwtAuthGuard, RequireTenantGuard)
  @Get(":importJobId")
  async get(@TenantId() tenantId: string, @Param("importJobId") importJobId: string) {
    const job = await this.jobs.findOne({ where: { tenantId, id: importJobId } });
    if (!job) return { error: "not_found" };
    return job;
  }
}

