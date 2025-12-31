import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "instrument_version" })
@Index(["tenantId", "instrumentId", "version"], { unique: true })
export class InstrumentVersion {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  instrumentId!: string;

  @Column({ type: "text" })
  version!: string;

  @Column({ type: "text", default: "draft" })
  status!: "draft" | "published" | "archived";

  @Column({ type: "text", default: "en" })
  defaultLanguage!: "en" | "ar";

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

