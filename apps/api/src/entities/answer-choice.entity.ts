import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "answer_choice" })
@Index(["questionId", "orderNo"], { unique: true })
@Index(["questionId", "value"], { unique: true })
export class AnswerChoice {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  questionId!: string;

  @Column({ type: "int" })
  orderNo!: number;

  @Column({ type: "text" })
  labelKey!: string;

  @Column({ type: "text" })
  value!: string;

  @Column({ type: "numeric", nullable: true })
  scoreValue!: string | null;
}

