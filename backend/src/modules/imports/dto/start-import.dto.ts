import { IsIn, IsOptional, IsString, Matches } from "class-validator";

export class StartImportDto {
  @IsIn(["excel", "csv", "json"])
  sourceType!: "excel" | "csv" | "json";

  @IsIn(["reject", "new_version", "overwrite_draft"])
  mode!: "reject" | "new_version" | "overwrite_draft";

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9_]{2,64}$/)
  instrumentKey?: string;
}

