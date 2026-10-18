import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationsTable1792333487474 implements MigrationInterface {
    name = 'AddNotificationsTable1792333487474'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`notifications\` (\`notification_id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`type\` enum ('request_submitted', 'request_reviewed', 'request_cancelled', 'task_assigned', 'task_status_changed', 'task_completed', 'task_due_soon', 'review_pending', 'review_submitted', 'review_reopened', 'payslip_generated', 'loan_instalment_paid', 'leave_balance_low', 'application_status') NOT NULL, \`title\` varchar(150) NOT NULL, \`message\` varchar(500) NOT NULL, \`link\` varchar(255) NULL, \`is_read\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_0f57a0c3adbbfd460935b7b046\` (\`user_id\`, \`is_read\`, \`created_at\`), PRIMARY KEY (\`notification_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_9a8a82462cab47c73d25f49261f\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_9a8a82462cab47c73d25f49261f\``);
        await queryRunner.query(`DROP INDEX \`IDX_0f57a0c3adbbfd460935b7b046\` ON \`notifications\``);
        await queryRunner.query(`DROP TABLE \`notifications\``);
    }

}
