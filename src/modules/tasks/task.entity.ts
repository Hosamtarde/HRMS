import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { TaskPriority, TaskStatus } from '../../common/enums/enums';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn()
  task_id!: number;

  @Column()
  assigned_by!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'assigned_by' })
  assigner!: UserEntity;

  @Column({ length: 150 })
  task_title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'date' })
  deadline!: string;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  task_priority!: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  task_status!: TaskStatus;

  @CreateDateColumn()
  created_at!: Date;
}