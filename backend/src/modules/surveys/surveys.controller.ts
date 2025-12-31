import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequireTenantGuard } from "../../common/tenant/require-tenant.guard";
import { TenantId } from "../../common/tenant/tenant.decorator";
import { CreateInstrumentDto } from "./dto/create-instrument.dto";
import { CreateVersionDto } from "./dto/create-version.dto";
import { SurveysService } from "./surveys.service";

@ApiTags("surveys")
@ApiBearerAuth()
@Controller("surveys")
export class SurveysController {
  constructor(private readonly surveys: SurveysService) {}

  @UseGuards(JwtAuthGuard, RequireTenantGuard)
  @Get("instruments")
  async list(@TenantId() tenantId: string) {
    return this.surveys.listInstruments(tenantId);
  }

  @UseGuards(JwtAuthGuard, RequireTenantGuard)
  @Post("instruments")
  async createInstrument(@TenantId() tenantId: string, @Body() dto: CreateInstrumentDto) {
    return this.surveys.createInstrument(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, RequireTenantGuard)
  @Post("instruments/:instrumentKey/versions")
  async createVersion(
    @TenantId() tenantId: string,
    @Param("instrumentKey") instrumentKey: string,
    @Body() dto: CreateVersionDto
  ) {
    return this.surveys.createVersion(tenantId, instrumentKey, dto);
  }

  @UseGuards(JwtAuthGuard, RequireTenantGuard)
  @Post("instruments/:instrumentKey/versions/:version/publish")
  async publish(
    @TenantId() tenantId: string,
    @Param("instrumentKey") instrumentKey: string,
    @Param("version") version: string
  ) {
    return this.surveys.publishVersion(tenantId, instrumentKey, version);
  }
}

