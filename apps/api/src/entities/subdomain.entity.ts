import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "subdomain" })
@Index(["tenantId", "domainId", "name"], { unique: true })
export class Subdomain {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  domainId!: string;

  @Column({ type: "text" })
  name!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

