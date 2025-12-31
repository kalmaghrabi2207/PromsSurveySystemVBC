import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequireTenantGuard } from "../../common/tenant/require-tenant.guard";
import { TenantId } from "../../common/tenant/tenant.decorator";
import { ReportingService } from "./reporting.service";

@ApiTags("reporting")
@ApiBearerAuth()
@Controller("reporting")
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @UseGuards(JwtAuthGuard, RequireTenantGuard)
  @Get("dashboard")
  async dashboard(
    @TenantId() tenantId: string,
    @Query("from") from?: string,
    @Query("to") to?: string
  ) {
    return this.reporting.dashboard(tenantId, from, to);
  }
}

