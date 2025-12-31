import { IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class CreateInstrumentDto {
  @IsString()
  @Matches(/^[A-Z0-9_]{2,64}$/)
  instrumentKey!: string;

  @IsString()
  @MinLength(2)
  displayName!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsIn(["en", "ar"])
  defaultLanguage?: "en" | "ar";

  @IsOptional()
  @IsString()
  version?: string;
}

