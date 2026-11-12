import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatUserIdToUsers1793580000000 implements MigrationInterface {
  name = 'AddChatUserIdToUsers1793580000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE users ADD COLUMN chat_user_id VARCHAR(64) NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_users_chat_user_id ON users (chat_user_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX uq_users_chat_user_id ON users`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN chat_user_id`);
  }
}