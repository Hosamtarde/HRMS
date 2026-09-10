import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { RecruitmentStatus } from '../../common/enums/enums';

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

  @Column({ type: 'enum', enum: RecruitmentStatus, default: RecruitmentStatus.PENDING })
  application_status!: RecruitmentStatus;

  @CreateDateColumn()
  submission_date!: Date;
}