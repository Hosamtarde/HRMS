import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';
import {AttendanceStatus} from '../../common/enums/enums';


@Entity('attendance_records')
export class AttendanceEntity {
  @PrimaryGeneratedColumn()
  attendance_id!: number;

  @Column()
  user_id!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity;

  @Column({ type: 'time', nullable: true })
  check_in_time!: string;

  @Column({ type: 'time', nullable: true })
  check_out_time!: string;

  @Column({ type: 'float', nullable: true })
  working_hours!: number;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  attendance_status!: AttendanceStatus;

  @Column({ type: 'date' })
  attendance_date!: string;
}