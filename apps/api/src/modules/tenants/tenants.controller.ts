import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequireTenantGuard } from "../../common/tenant/require-tenant.guard";
import { TenantId } from "../../common/tenant/tenant.decorator";
import { TenantsService } from "./tenants.service";

@ApiTags("tenants")
@ApiBearerAuth()
@Controller("tenants")
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @UseGuards(JwtAuthGuard, RequireTenantGuard)
  @Get("me")
  async me(@TenantId() tenantId: string) {
    return this.tenants.getById(tenantId);
  }
}

