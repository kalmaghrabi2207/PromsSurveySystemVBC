import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "import_job" })
@Index(["tenantId", "createdAt"])
export class ImportJob {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "text" })
  sourceType!: "excel" | "csv" | "json";

  @Column({ type: "text", nullable: true })
  originalFilename!: string | null;

  @Column({ type: "text" })
  mode!: "reject" | "new_version" | "overwrite_draft";

  @Column({ type: "text" })
  status!: "queued" | "processing" | "completed" | "failed";

  @Column({ type: "text", nullable: true })
  storagePath!: string | null;

  @Column({ type: "jsonb", default: {} })
  reportJson!: Record<string, unknown>;

  @Column({ type: "jsonb", default: {} })
  normalizedJson!: Record<string, unknown>;

  @Column({ type: "text", nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  completedAt!: Date | null;
}

