import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class RequireTenantGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const tenantId = req.tenantId as string | undefined;
    if (!tenantId) throw new UnauthorizedException("Missing X-Tenant-Id");
    return true;
  }
}

