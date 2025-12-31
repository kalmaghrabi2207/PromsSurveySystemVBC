import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "section" })
@Index(["instrumentVersionId", "orderNo"], { unique: true })
export class Section {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  instrumentVersionId!: string;

  @Column({ type: "int" })
  orderNo!: number;

  @Column({ type: "text" })
  titleKey!: string;
}

