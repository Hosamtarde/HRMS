import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn()
  token_id!: number;

  @Column()
  user_id!: number;

  @Column({ length: 64 })
  token_hash!: string;

  @Column({ type: 'datetime' })
  expires_at!: Date;

  @Column({ type: 'datetime', nullable: true })
  revoked_at!: Date | null;

  @CreateDateColumn({ type: 'datetime', precision: 6 })
  created_at!: Date;
}