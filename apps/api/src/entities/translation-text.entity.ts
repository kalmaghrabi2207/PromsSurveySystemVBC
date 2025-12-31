import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "translation_text" })
@Index(["instrumentVersionId", "language", "key"], { unique: true })
export class TranslationText {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  instrumentVersionId!: string;

  @Column({ type: "text" })
  language!: "en" | "ar";

  @Column({ type: "text" })
  key!: string;

  @Column({ type: "text" })
  text!: string;
}

