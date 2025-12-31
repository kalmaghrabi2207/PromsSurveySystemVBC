import { IsArray, IsString } from "class-validator";

export class PatientSaveDto {
  @IsArray()
  responses!: Array<{
    questionId: string;
    answer: string | number | string[];
  }>;
}

