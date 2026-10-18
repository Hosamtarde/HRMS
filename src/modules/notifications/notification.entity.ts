import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { NotificationType } from '../../common/enums/enums';

@Entity('notifications')
@Index(['user_id', 'is_read', 'created_at'])
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  notification_id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ length: 150 })
  title!: string;

  @Column({ length: 500 })
  message!: string;

  @Column({ length: 255, nullable: true })
  link!: string;

  @Column({ default: false })
  is_read!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}