import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response } from "express";

export interface TenantRequest extends Request {
  tenantId?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: TenantRequest, _res: Response, next: () => void) {
    const tenantId = req.header("X-Tenant-Id");
    if (tenantId) req.tenantId = tenantId;
    next();
  }
}

