import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { QuestionType } from "../common/enums";

@Entity({ name: "question" })
@Index(["tenantId", "instrumentVersionId", "code"], { unique: true })
@Index(["questionGroupId", "orderNo"], { unique: true })
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  instrumentId!: string;

  @Column({ type: "uuid" })
  instrumentVersionId!: string;

  @Column({ type: "uuid" })
  questionGroupId!: string;

  @Column({ type: "int" })
  orderNo!: number;

  @Column({ type: "text" })
  code!: string;

  @Column({ type: "text" })
  type!: QuestionType;

  @Column({ type: "text" })
  textKey!: string;

  @Column({ type: "boolean", default: false })
  isRequired!: boolean;

  @Column({ type: "numeric", default: 1 })
  scoreWeight!: string;
}

