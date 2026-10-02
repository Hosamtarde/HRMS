import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRequestsTable1788697597715 implements MigrationInterface {
    name = 'CreateRequestsTable1788697597715'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`requests\` (\`request_id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`request_type\` enum ('leave', 'loan', 'permission', 'custom') NOT NULL, \`leave_type\` enum ('annual', 'sick', 'emergency', 'unpaid') NULL, \`start_date\` date NULL, \`end_date\` date NULL, \`loan_amount\` decimal(10,2) NULL, \`repayment_period\` int NULL, \`reason\` text NOT NULL, \`attachment\` varchar(255) NULL, \`request_status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`reviewed_by\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`request_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`requests\` ADD CONSTRAINT \`FK_9e5e2eb56e3837b43e5a547be23\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`requests\` ADD CONSTRAINT \`FK_81d7657a4da8becffab9b1997aa\` FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`requests\` DROP FOREIGN KEY \`FK_81d7657a4da8becffab9b1997aa\``);
        await queryRunner.query(`ALTER TABLE \`requests\` DROP FOREIGN KEY \`FK_9e5e2eb56e3837b43e5a547be23\``);
        await queryRunner.query(`DROP TABLE \`requests\``);
    }

}
