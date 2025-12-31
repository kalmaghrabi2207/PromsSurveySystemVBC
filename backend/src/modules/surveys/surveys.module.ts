import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Instrument } from "../../entities/instrument.entity";
import { InstrumentVersion } from "../../entities/instrument-version.entity";
import { Section } from "../../entities/section.entity";
import { QuestionGroup } from "../../entities/question-group.entity";
import { Question } from "../../entities/question.entity";
import { AnswerChoice } from "../../entities/answer-choice.entity";
import { QuestionValidation } from "../../entities/question-validation.entity";
import { TranslationText } from "../../entities/translation-text.entity";
import { SurveysController } from "./surveys.controller";
import { SurveysService } from "./surveys.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Instrument,
      InstrumentVersion,
      Section,
      QuestionGroup,
      Question,
      AnswerChoice,
      QuestionValidation,
      TranslationText
    ])
  ],
  controllers: [SurveysController],
  providers: [SurveysService],
  exports: [SurveysService]
})
export class SurveysModule {}

