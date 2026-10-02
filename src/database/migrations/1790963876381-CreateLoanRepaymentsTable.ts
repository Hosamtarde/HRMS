import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLoanRepaymentsTable1790963876381 implements MigrationInterface {
    name = 'CreateLoanRepaymentsTable1790963876381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`loan_repayments\` (\`repayment_id\` int NOT NULL AUTO_INCREMENT, \`request_id\` int NOT NULL, \`installment_no\` int NOT NULL, \`due_date\` date NOT NULL, \`amount\` decimal(10,2) NOT NULL, \`repayment_status\` enum ('pending', 'paid') NOT NULL DEFAULT 'pending', \`paid_at\` datetime NULL, \`payroll_id\` int NULL, UNIQUE INDEX \`IDX_72b327319d906fa1d8efc6c168\` (\`request_id\`, \`installment_no\`), PRIMARY KEY (\`repayment_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`loan_repayments\` ADD CONSTRAINT \`FK_9b5ed9e4998a69e1ba371a4a41d\` FOREIGN KEY (\`request_id\`) REFERENCES \`requests\`(\`request_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`loan_repayments\` ADD CONSTRAINT \`FK_6e0cb1e284fba21c8c403ebc75b\` FOREIGN KEY (\`payroll_id\`) REFERENCES \`payroll_records\`(\`payroll_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayments\` DROP FOREIGN KEY \`FK_6e0cb1e284fba21c8c403ebc75b\``);
        await queryRunner.query(`ALTER TABLE \`loan_repayments\` DROP FOREIGN KEY \`FK_9b5ed9e4998a69e1ba371a4a41d\``);
        await queryRunner.query(`DROP INDEX \`IDX_72b327319d906fa1d8efc6c168\` ON \`loan_repayments\``);
        await queryRunner.query(`DROP TABLE \`loan_repayments\``);
    }

}
