import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

@Entity('departments')
export class DepartmentEntity {
  @PrimaryGeneratedColumn()
  department_id!: number;

  @Column({ length: 100 })
  department_name!: string;

  @Column({ nullable: true })
  manager_id!: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager!: UserEntity;
}