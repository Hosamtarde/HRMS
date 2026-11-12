import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { RecruitmentStatus } from '../../common/enums/enums';

@Index(['submission_date'])
@Entity('recruitment')
export class RecruitmentEntity {
  @PrimaryGeneratedColumn()
  application_id!: number;

  @Column({ length: 100 })
  applicant_name!: string;

  @Column({ length: 150 })
  email!: string;

  @Column({ length: 20, nullable: true })
  phone_number!: string;

  @Column()
  cv_file!: string;

  @Column({ length: 100 })
  applied_position!: string;

  @Column({
    type: 'enum',
    enum: RecruitmentStatus,
    default: RecruitmentStatus.PENDING,
  })
  application_status!: RecruitmentStatus;

  @Column({ type: 'datetime', nullable: true })
  interview_at!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  meeting_url!: string | null;

  @Column({ type: 'datetime', nullable: true })
  reminder_sent_at!: Date | null;

  @CreateDateColumn()
  submission_date!: Date;
}
