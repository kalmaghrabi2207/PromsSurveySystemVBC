import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class EmrApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const key = req.header("X-EMR-Api-Key") as string | undefined;
    const expected = process.env.EMR_API_KEY;
    if (!expected) throw new UnauthorizedException("Server not configured for EMR auth");
    if (!key || key !== expected) throw new UnauthorizedException("Invalid EMR API key");
    return true;
  }
}

