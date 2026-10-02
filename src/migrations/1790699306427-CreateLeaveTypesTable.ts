import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLeaveTypesTable1790699306427 implements MigrationInterface {
    name = 'CreateLeaveTypesTable1790699306427'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`leave_types\` (\`leave_type_id\` int NOT NULL AUTO_INCREMENT, \`type_name\` varchar(100) NOT NULL, \`payment_type\` enum ('paid', 'half_paid', 'unpaid') NOT NULL, \`default_days\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_fd3727619e89c2aec9b103a818\` (\`type_name\`), PRIMARY KEY (\`leave_type_id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_fd3727619e89c2aec9b103a818\` ON \`leave_types\``);
        await queryRunner.query(`DROP TABLE \`leave_types\``);
    }

}
