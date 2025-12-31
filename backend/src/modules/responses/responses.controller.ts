import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PatientSaveDto } from "./dto/patient-save.dto";
import { ResponsesService } from "./responses.service";
import { AssignmentsService } from "../assignments/assignments.service";

@ApiTags("public")
@Controller("public")
export class PublicSurveysController {
  constructor(
    private readonly responses: ResponsesService,
    private readonly assignments: AssignmentsService
  ) {}

  @Get("surveys/:token/start")
  async start(@Param("token") token: string) {
    return this.responses.start(token);
  }

  @Post("surveys/:token/save")
  async save(@Param("token") token: string, @Body() dto: PatientSaveDto) {
    return this.responses.save(token, dto);
  }

  @Post("surveys/:token/submit")
  async submit(@Param("token") token: string, @Body() dto: PatientSaveDto) {
    return this.responses.submit(token, dto);
  }

  @Post("surveys/:token/request-refresh")
  async requestRefresh(@Param("token") token: string) {
    const publicBaseUrl = process.env.PUBLIC_BASE_URL ?? "http://localhost:3000";
    return this.assignments.rotateToken("", token, publicBaseUrl);
  }
}

