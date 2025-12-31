import { IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { QuestionType } from "../../../common/enums";

export type SurveyDefinitionDto = {
  sections: Array<{
    title: { en: string; ar?: string };
    groups: Array<{
      title?: { en: string; ar?: string };
      subgroupTitle?: { en: string; ar?: string };
      questions: Array<{
        code: string;
        type: QuestionType;
        text: { en: string; ar?: string };
        required?: boolean;
        min?: number | string;
        max?: number | string;
        scoreWeight?: number;
        options?: Array<{
          value: string;
          label: { en: string; ar?: string };
          score?: number;
        }>;
        logicJson?: Record<string, unknown>;
      }>;
    }>;
  }>;
};

export class CreateVersionDto {
  @IsString()
  @MinLength(1)
  version!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsIn(["en", "ar"])
  defaultLanguage?: "en" | "ar";

  // Using JSON body for definition (validated server-side by runtime checks)
  definition!: SurveyDefinitionDto;
}

