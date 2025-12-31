import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SurveyAssignment } from "../../entities/survey-assignment.entity";
import { OutreachMessage } from "../../entities/outreach-message.entity";
import { SurveyResponse } from "../../entities/survey-response.entity";
import { ReportingController } from "./reporting.controller";
import { ReportingService } from "./reporting.service";

@Module({
  imports: [TypeOrmModule.forFeature([SurveyAssignment, OutreachMessage, SurveyResponse])],
  controllers: [ReportingController],
  providers: [ReportingService]
})
export class ReportingModule {}

