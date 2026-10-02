import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateActivityLogsTable1790621647468 implements MigrationInterface {
    name = 'CreateActivityLogsTable1790621647468'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`activity_logs\` (\`log_id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NULL, \`action\` enum ('create', 'update', 'delete') NOT NULL, \`entity\` varchar(50) NOT NULL, \`entity_id\` int NULL, \`method\` varchar(10) NOT NULL, \`path\` varchar(255) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`log_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`activity_logs\` ADD CONSTRAINT \`FK_d54f841fa5478e4734590d44036\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`activity_logs\` DROP FOREIGN KEY \`FK_d54f841fa5478e4734590d44036\``);
        await queryRunner.query(`DROP TABLE \`activity_logs\``);
    }

}
