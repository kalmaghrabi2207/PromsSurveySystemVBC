import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "instrument" })
@Index(["tenantId", "instrumentKey"], { unique: true })
export class Instrument {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid", nullable: true })
  subdomainId!: string | null;

  @Column({ type: "text" })
  instrumentKey!: string;

  @Column({ type: "text" })
  displayName!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

