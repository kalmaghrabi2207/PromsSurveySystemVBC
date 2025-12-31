import { Controller, Get, Headers, Param, Post, Body, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireTenantGuard } from "../../common/tenant/require-tenant.guard";
import { TenantId } from "../../common/tenant/tenant.decorator";
import { EmrApiKeyGuard } from "../../common/auth/emr-api-key.guard";
import { EmrCreateAssignmentDto } from "./dto/emr-create-assignment.dto";
import { AssignmentsService } from "./assignments.service";

@ApiTags("emr")
@Controller("emr")
export class EmrAssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @UseGuards(EmrApiKeyGuard, RequireTenantGuard)
  @Post("assignments")
  async create(
    @TenantId() tenantId: string,
    @Headers("idempotency-key") idempotencyKey: string,
    @Body() dto: EmrCreateAssignmentDto
  ) {
    const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
    return this.assignments.createFromEmr({
      tenantId,
      clientId: "emr_api_key",
      idempotencyKey,
      dto,
      publicBaseUrl
    });
  }

  @UseGuards(EmrApiKeyGuard, RequireTenantGuard)
  @Get("assignments/:assignmentId")
  async status(@TenantId() tenantId: string, @Param("assignmentId") assignmentId: string) {
    return this.assignments.getStatus(tenantId, assignmentId);
  }
}

