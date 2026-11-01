import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddManagerChangedNotification1793540300000
  implements MigrationInterface
{
  name = 'AddManagerChangedNotification1793540300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE notifications MODIFY COLUMN type ENUM('request_submitted','request_reviewed','request_cancelled','task_assigned','task_status_changed','task_completed','task_due_soon','review_pending','review_submitted','review_reopened','payslip_generated','loan_instalment_paid','leave_balance_low','application_status','manager_changed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM notifications WHERE type = 'manager_changed'`,
    );
    await queryRunner.query(
      `ALTER TABLE notifications MODIFY COLUMN type ENUM('request_submitted','request_reviewed','request_cancelled','task_assigned','task_status_changed','task_completed','task_due_soon','review_pending','review_submitted','review_reopened','payslip_generated','loan_instalment_paid','leave_balance_low','application_status') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL`,
    );
  }
}