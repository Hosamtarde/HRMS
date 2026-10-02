import { MigrationInterface, QueryRunner } from "typeorm";

export class AddServiceTiersFlag1790946885450 implements MigrationInterface {
    name = 'AddServiceTiersFlag1790946885450'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`leave_types\` ADD \`uses_service_tiers\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`leave_types\` DROP COLUMN \`uses_service_tiers\``);
    }

}
