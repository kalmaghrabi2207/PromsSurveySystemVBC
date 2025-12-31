import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "idempotency_record" })
@Index(["tenantId", "clientId", "key"], { unique: true })
export class IdempotencyRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "text" })
  clientId!: string;

  @Column({ type: "text" })
  key!: string;

  @Column({ type: "text" })
  requestHash!: string;

  @Column({ type: "int" })
  responseCode!: number;

  @Column({ type: "jsonb" })
  responseBody!: unknown;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz" })
  expiresAt!: Date;
}

