import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "logic_rule" })
export class LogicRule {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  instrumentVersionId!: string;

  @Column({ type: "text" })
  action!: "show" | "hide" | "skip_to";

  @Column({ type: "uuid", nullable: true })
  targetSectionId!: string | null;

  @Column({ type: "uuid", nullable: true })
  targetGroupId!: string | null;

  @Column({ type: "uuid", nullable: true })
  targetQuestionId!: string | null;

  @Column({ type: "uuid", nullable: true })
  skipToSectionId!: string | null;

  @Column({ type: "uuid", nullable: true })
  skipToQuestionId!: string | null;

  @Column({ type: "jsonb" })
  ruleJson!: Record<string, unknown>;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

