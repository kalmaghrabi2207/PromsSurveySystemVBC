import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireTenantGuard } from "../../common/tenant/require-tenant.guard";
import { TenantId } from "../../common/tenant/tenant.decorator";
import { LoginDto } from "./dto/login.dto";
import { AuthService } from "./auth.service";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(RequireTenantGuard)
  @Post("login")
  async login(@TenantId() tenantId: string, @Body() dto: LoginDto) {
    return this.auth.login(tenantId, dto.email, dto.password);
  }
}

