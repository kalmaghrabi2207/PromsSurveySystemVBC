import { IsArray, IsDateString, IsIn, IsOptional, IsString, Matches } from "class-validator";
import { OutreachChannel } from "../../../common/enums";

export class EmrCreateAssignmentDto {
  @IsString()
  patientKey!: string;

  @IsString()
  encounterId!: string;

  @IsDateString()
  encounterDateTime!: string;

  @IsOptional()
  @IsString()
  facilityId?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsArray()
  diagnosisCodes!: string[];

  @IsArray()
  procedureCodes!: string[];

  @IsOptional()
  @IsIn(["en", "ar"])
  languagePreference?: "en" | "ar";

  @IsArray()
  @IsOptional()
  contactChannels?: OutreachChannel[];

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @Matches(/^[A-Z0-9_]{2,64}$/)
  surveyInstrumentCode!: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

