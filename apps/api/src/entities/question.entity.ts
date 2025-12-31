import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { QuestionType } from "../common/enums";

@Entity({ name: "question" })
@Index(["tenantId", "instrumentId", "code"], { unique: true })
@Index(["questionGroupId", "orderNo"], { unique: true })
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  // Used for duplicate detection across versions
  @Column({ type: "uuid" })
  instrumentId!: string;

  @Column({ type: "uuid" })
  questionGroupId!: string;

  @Column({ type: "int" })
  orderNo!: number;

  @Column({ type: "text" })
  code!: string; // QuestionCode

  @Column({ type: "text" })
  type!: QuestionType;

  @Column({ type: "text" })
  textKey!: string;

  @Column({ type: "text", nullable: true })
  helpTextKey!: string | null;

  @Column({ type: "boolean", default: false })
  isRequired!: boolean;

  @Column({ type: "numeric", default: 1 })
  scoreWeight!: string;
}

