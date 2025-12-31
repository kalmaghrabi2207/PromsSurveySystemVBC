import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Instrument } from "../../entities/instrument.entity";
import { InstrumentVersion } from "../../entities/instrument-version.entity";
import { SurveyAssignment } from "../../entities/survey-assignment.entity";
import { AssignmentToken } from "../../entities/assignment-token.entity";
import { IdempotencyRecord } from "../../entities/idempotency-record.entity";
import { OutreachMessage } from "../../entities/outreach-message.entity";
import { AssignmentsService } from "./assignments.service";
import { EmrAssignmentsController } from "./assignments.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Instrument,
      InstrumentVersion,
      SurveyAssignment,
      AssignmentToken,
      IdempotencyRecord,
      OutreachMessage
    ])
  ],
  controllers: [EmrAssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService]
})
export class AssignmentsModule {}

