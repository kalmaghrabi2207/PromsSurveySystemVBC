import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { UserRole } from "../common/enums";
import { Tenant } from "./tenant.entity";

@Entity({ name: "user_account" })
@Index(["tenantId", "email"], { unique: true })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @ManyToOne(() => Tenant, (t) => t.users, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "tenantId" })
  tenant!: Tenant;

  @Column({ type: "text" })
  email!: string;

  @Column({ type: "text" })
  passwordHash!: string;

  @Column({ type: "text" })
  role!: UserRole;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

