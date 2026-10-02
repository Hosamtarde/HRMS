import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePayrollTable1789563404325 implements MigrationInterface {
    name = 'CreatePayrollTable1789563404325'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`payroll_records\` (\`payroll_id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`basic_salary\` decimal(10,2) NOT NULL, \`bonuses\` decimal(10,2) NOT NULL DEFAULT '0.00', \`deductions\` decimal(10,2) NOT NULL DEFAULT '0.00', \`net_salary\` decimal(10,2) NOT NULL, \`salary_month\` date NOT NULL, \`generated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`payroll_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`payroll_records\` ADD CONSTRAINT \`FK_a104628dfc73edd2bca5cc5ebba\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`payroll_records\` DROP FOREIGN KEY \`FK_a104628dfc73edd2bca5cc5ebba\``);
        await queryRunner.query(`DROP TABLE \`payroll_records\``);
    }

}
