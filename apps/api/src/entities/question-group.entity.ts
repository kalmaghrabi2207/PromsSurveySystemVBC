import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "question_group" })
@Index(["sectionId", "parentGroupId", "orderNo"], { unique: true })
export class QuestionGroup {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  sectionId!: string;

  @Column({ type: "uuid", nullable: true })
  parentGroupId!: string | null;

  @Column({ type: "int" })
  orderNo!: number;

  @Column({ type: "text", nullable: true })
  titleKey!: string | null;

  @Column({ type: "text", nullable: true })
  subgroupKey!: string | null;
}

