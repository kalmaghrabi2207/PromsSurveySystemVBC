import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "tenant" })
export class Tenant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "text" })
  code!: string;

  @Column({ type: "text" })
  name!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}

