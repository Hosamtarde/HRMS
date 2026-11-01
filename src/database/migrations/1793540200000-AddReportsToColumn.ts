import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReportsToColumn1793540200000 implements MigrationInterface {
  name = 'AddReportsToColumn1793540200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE employee_profiles ADD COLUMN reports_to INT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_profiles_reports_to ON employee_profiles (reports_to)`,
    );
    await queryRunner.query(
      `ALTER TABLE employee_profiles ADD CONSTRAINT fk_profiles_reports_to FOREIGN KEY (reports_to) REFERENCES users (user_id) ON DELETE SET NULL`,
    );
    await queryRunner.query(
      `INSERT INTO employee_profiles (user_id, department_id, position, hire_date, basic_salary, employment_type) SELECT u.user_id, NULL, u.role, DATE(u.created_at), 0, 'full_time' FROM users u LEFT JOIN employee_profiles p ON p.user_id = u.user_id WHERE p.user_id IS NULL AND u.role <> 'applicant'`,
    );
    await queryRunner.query(
      `UPDATE employee_profiles p JOIN departments d ON d.department_id = p.department_id SET p.reports_to = d.manager_id WHERE d.manager_id IS NOT NULL AND p.user_id <> d.manager_id`,
    );
    await queryRunner.query(
      `UPDATE employee_profiles p, (SELECT user_id FROM users WHERE role = 'hr_admin' ORDER BY user_id LIMIT 1) r SET p.reports_to = r.user_id WHERE p.reports_to IS NULL AND p.user_id <> r.user_id`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE employee_profiles DROP FOREIGN KEY fk_profiles_reports_to`,
    );
    await queryRunner.query(
      `DROP INDEX idx_profiles_reports_to ON employee_profiles`,
    );
    await queryRunner.query(
      `ALTER TABLE employee_profiles DROP COLUMN reports_to`,
    );
  }
}