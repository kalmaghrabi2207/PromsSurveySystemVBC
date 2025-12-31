import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "question_validation" })
@Index(["questionId"], { unique: true })
export class QuestionValidation {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  questionId!: string;

  @Column({ type: "boolean", nullable: true })
  required!: boolean | null;

  @Column({ type: "numeric", nullable: true })
  minNumeric!: string | null;

  @Column({ type: "numeric", nullable: true })
  maxNumeric!: string | null;

  @Column({ type: "text", nullable: true })
  regex!: string | null;

  @Column({ type: "jsonb", default: {} })
  ruleJson!: Record<string, unknown>;
}

