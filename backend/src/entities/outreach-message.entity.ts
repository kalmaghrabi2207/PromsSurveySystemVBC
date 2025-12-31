import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { DeliveryStatus, OutreachChannel } from "../common/enums";

@Entity({ name: "outreach_message" })
@Index(["tenantId", "status", "createdAt"])
export class OutreachMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  tenantId!: string;

  @Column({ type: "uuid" })
  assignmentId!: string;

  @Column({ type: "text" })
  channel!: OutreachChannel;

  @Column({ type: "text" })
  destination!: string;

  @Column({ type: "text", default: DeliveryStatus.Queued })
  status!: DeliveryStatus;

  @Column({ type: "text", nullable: true })
  providerMessageId!: string | null;

  @Column({ type: "text", nullable: true })
  error!: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  sentAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  deliveredAt!: Date | null;
}

