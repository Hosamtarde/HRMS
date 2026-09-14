import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { UserEntity } from '../users/user.entity';
import { TaskEntity } from './task.entity';

@Entity('assigned_tasks')
export class AssignedTaskEntity {
  @PrimaryColumn()
  user_id!: number;

  @PrimaryColumn()
  task_id!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @ManyToOne(() => TaskEntity)
  @JoinColumn({ name: 'task_id' })
  task!: TaskEntity;

  @CreateDateColumn()
  assigned_at!: Date;

  @Column({ type: 'int', default: 0 })
  completion_percentage!: number;
}