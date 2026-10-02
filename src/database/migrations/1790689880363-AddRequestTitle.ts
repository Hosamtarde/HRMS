import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRequestTitle1790689880363 implements MigrationInterface {
    name = 'AddRequestTitle1790689880363'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`requests\` ADD \`request_title\` varchar(150) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`requests\` DROP COLUMN \`request_title\``);
    }

}
