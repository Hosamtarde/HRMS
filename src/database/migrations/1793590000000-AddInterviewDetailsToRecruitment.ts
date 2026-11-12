import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInterviewDetailsToRecruitment1793590000000 implements MigrationInterface {
  name = 'AddInterviewDetailsToRecruitment1793590000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE recruitment ADD COLUMN interview_at DATETIME NULL, ADD COLUMN meeting_url VARCHAR(255) NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE recruitment DROP COLUMN meeting_url, DROP COLUMN interview_at`,
    );
  }
}