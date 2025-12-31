import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "survey_response_item" })
@Index(["responseId", "questionId"], { unique: true })
export class SurveyResponseItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  responseId!: string;

  @Column({ type: "uuid" })
  questionId!: string;

  @Column({ type: "jsonb" })
  answerJson!: unknown;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

