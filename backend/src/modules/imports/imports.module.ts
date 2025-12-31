import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ImportJob } from "../../entities/import-job.entity";
import { Instrument } from "../../entities/instrument.entity";
import { InstrumentVersion } from "../../entities/instrument-version.entity";
import { Question } from "../../entities/question.entity";
import { SurveysModule } from "../surveys/surveys.module";
import { ImportsController } from "./imports.controller";
import { ImportsService } from "./imports.service";
import { ImportsProcessor } from "./imports.processor";

@Module({
  imports: [
    TypeOrmModule.forFeature([ImportJob, Instrument, InstrumentVersion, Question]),
    BullModule.registerQueue({ name: "imports" }),
    SurveysModule
  ],
  controllers: [ImportsController],
  providers: [ImportsService, ImportsProcessor]
})
export class ImportsModule {}

