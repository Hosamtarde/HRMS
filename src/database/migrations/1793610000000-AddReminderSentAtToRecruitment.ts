import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReminderSentAtToRecruitment1793610000000
  implements MigrationInterface
{
  name = 'AddReminderSentAtToRecruitment1793610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE recruitment ADD COLUMN reminder_sent_at DATETIME NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE recruitment DROP COLUMN reminder_sent_at`,
    );
  }
}