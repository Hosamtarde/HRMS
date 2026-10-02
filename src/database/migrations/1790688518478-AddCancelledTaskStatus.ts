import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancelledTaskStatus1790688518478 implements MigrationInterface {
    name = 'AddCancelledTaskStatus1790688518478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`task_status\` \`task_status\` enum ('to-do', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'to-do'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tasks\` CHANGE \`task_status\` \`task_status\` enum ('to-do', 'in_progress', 'completed') NOT NULL DEFAULT 'to-do'`);
    }

}
