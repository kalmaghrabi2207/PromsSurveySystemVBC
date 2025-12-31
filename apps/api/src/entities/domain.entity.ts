import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "domain" })
@Index(["tenantId", "name"], { unique: true })
export class Domain {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "text" })
  name!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

