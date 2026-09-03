import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/enums';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  user_id !: number;

  @Column({ length: 100 })
  first_name!: string;

  @Column({ length: 100 })
  last_name!: string;

  @Column({ length: 150, unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ type: 'enum', enum: Role, default: Role.EMPLOYEE })
  role!: Role;

  @Column({ length: 20, nullable: true })
  phone_number!: string;

  @Column({ length: 255, nullable: true })
  profile_image!: string;

  @Column({ default: true })
  status!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}