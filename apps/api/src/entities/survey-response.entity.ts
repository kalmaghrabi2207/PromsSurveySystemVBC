import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "survey_response" })
@Index(["tenantId", "completedAt"])
export class SurveyResponse {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Index({ unique: true })
  @Column({ type: "uuid" })
  assignmentId!: string;

  @CreateDateColumn({ type: "timestamptz" })
  startedAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  completedAt!: Date | null;

  @Column({ type: "int", nullable: true })
  totalSeconds!: number | null;

  @Column({ type: "jsonb", default: {} })
  scoreJson!: Record<string, unknown>;

  @Column({ type: "text", nullable: true })
  freeText!: string | null;

  @Column({ type: "text", nullable: true })
  sentiment!: string | null;
}

