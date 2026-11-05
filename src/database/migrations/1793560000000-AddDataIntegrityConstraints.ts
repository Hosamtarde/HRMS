import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDataIntegrityConstraints1793560000000 implements MigrationInterface {
  name = 'AddDataIntegrityConstraints1793560000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE attendance_records MODIFY COLUMN working_hours DECIMAL(5,2) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE attendance_records ADD CONSTRAINT uq_attendance_user_date UNIQUE (user_id, attendance_date)`,
    );
    await queryRunner.query(
      `ALTER TABLE payroll_records ADD CONSTRAINT uq_payroll_user_month UNIQUE (user_id, salary_month)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE payroll_records DROP INDEX uq_payroll_user_month`,
    );
    await queryRunner.query(
      `ALTER TABLE attendance_records DROP INDEX uq_attendance_user_date`,
    );
    await queryRunner.query(
      `ALTER TABLE attendance_records MODIFY COLUMN working_hours FLOAT NULL`,
    );
  }
}