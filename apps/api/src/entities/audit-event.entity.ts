import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "audit_event" })
@Index(["tenantId", "createdAt"])
export class AuditEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "text", nullable: true })
  actorUserId!: string | null;

  @Column({ type: "text", default: "user" })
  actorType!: "user" | "emr" | "system";

  @Column({ type: "text" })
  action!: string;

  @Column({ type: "text" })
  entityType!: string;

  @Column({ type: "text", nullable: true })
  entityId!: string | null;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @Column({ type: "text", nullable: true })
  ip!: string | null;

  @Column({ type: "text", nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

