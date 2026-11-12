import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInterviewScheduledNotification1793600000000
  implements MigrationInterface
{
  name = 'AddInterviewScheduledNotification1793600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE notifications MODIFY COLUMN type ENUM('request_submitted','request_reviewed','request_cancelled','task_assigned','task_status_changed','task_completed','task_due_soon','review_pending','review_submitted','review_reopened','payslip_generated','loan_instalment_paid','leave_balance_low','application_status','manager_changed','interview_scheduled') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM notifications WHERE type = 'interview_scheduled'`,
    );
    await queryRunner.query(
      `ALTER TABLE notifications MODIFY COLUMN type ENUM('request_submitted','request_reviewed','request_cancelled','task_assigned','task_status_changed','task_completed','task_due_soon','review_pending','review_submitted','review_reopened','payslip_generated','loan_instalment_paid','leave_balance_low','application_status','manager_changed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL`,
    );
  }
}