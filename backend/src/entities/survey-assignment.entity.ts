import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { AssignmentStatus } from "../common/enums";

@Entity({ name: "survey_assignment" })
@Index(["tenantId", "encounterDateTime"])
@Index(["tenantId", "instrumentKey", "encounterDateTime"])
@Index(["tenantId", "providerId", "encounterDateTime"])
@Index(["tenantId", "department", "encounterDateTime"])
export class SurveyAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  instrumentId!: string;

  @Column({ type: "uuid" })
  instrumentVersionId!: string;

  @Column({ type: "text" })
  instrumentKey!: string;

  @Column({ type: "text", default: AssignmentStatus.Created })
  status!: AssignmentStatus;

  @Column({ type: "text", default: "en" })
  preferredLanguage!: "en" | "ar";

  @Column({ type: "text" })
  patientKey!: string;

  @Column({ type: "text", nullable: true })
  mrnHash!: string | null;

  @Column({ type: "text", nullable: true })
  nationalIdHash!: string | null;

  @Column({ type: "text" })
  encounterId!: string;

  @Column({ type: "timestamptz" })
  encounterDateTime!: Date;

  @Column({ type: "text", nullable: true })
  facilityId!: string | null;

  @Column({ type: "text", nullable: true })
  department!: string | null;

  @Column({ type: "text", nullable: true })
  providerId!: string | null;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  diagnosisCodes!: string[];

  @Column({ type: "text", array: true, default: () => "'{}'" })
  procedureCodes!: string[];

  @Column({ type: "timestamptz", nullable: true })
  dueDate!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  expiryDate!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  sentAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  openedAt!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

