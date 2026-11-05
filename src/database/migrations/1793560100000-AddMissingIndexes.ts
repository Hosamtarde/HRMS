import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingIndexes1793560100000 implements MigrationInterface {
  name = 'AddMissingIndexes1793560100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX idx_requests_user_status ON requests (user_id, request_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_requests_status_created ON requests (request_status, created_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_recruitment_status ON recruitment (application_status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_activity_logs_created ON activity_logs (created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_activity_logs_created ON activity_logs`);
    await queryRunner.query(`DROP INDEX idx_recruitment_status ON recruitment`);
    await queryRunner.query(`DROP INDEX idx_requests_status_created ON requests`);
    await queryRunner.query(`DROP INDEX idx_requests_user_status ON requests`);
  }
}