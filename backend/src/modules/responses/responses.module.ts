import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AssignmentToken } from "../../entities/assignment-token.entity";
import { SurveyAssignment } from "../../entities/survey-assignment.entity";
import { SurveyResponse } from "../../entities/survey-response.entity";
import { SurveyResponseItem } from "../../entities/survey-response-item.entity";
import { Question } from "../../entities/question.entity";
import { AnswerChoice } from "../../entities/answer-choice.entity";
import { InstrumentVersion } from "../../entities/instrument-version.entity";
import { SurveysModule } from "../surveys/surveys.module";
import { AssignmentsModule } from "../assignments/assignments.module";
import { ResponsesService } from "./responses.service";
import { PublicSurveysController } from "./responses.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssignmentToken,
      SurveyAssignment,
      SurveyResponse,
      SurveyResponseItem,
      Question,
      AnswerChoice,
      InstrumentVersion
    ]),
    SurveysModule,
    AssignmentsModule
  ],
  controllers: [PublicSurveysController],
  providers: [ResponsesService]
})
export class ResponsesModule {}

