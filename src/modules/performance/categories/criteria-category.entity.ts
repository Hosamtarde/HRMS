import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('criteria_categories')
export class CriteriaCategoryEntity {
  @PrimaryGeneratedColumn()
  category_id!: number;

  @Column({ length: 100, unique: true })
  category_name!: string;

  @Column({ length: 255, nullable: true })
  description!: string;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;
}