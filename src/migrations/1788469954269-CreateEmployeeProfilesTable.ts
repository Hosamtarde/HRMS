import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEmployeeProfilesTable1788469954269 implements MigrationInterface {
    name = 'CreateEmployeeProfilesTable1788469954269'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`employee_profiles\` (\`user_id\` int NOT NULL, \`department_id\` int NULL, \`position\` varchar(100) NOT NULL, \`hire_date\` date NOT NULL, \`basic_salary\` decimal(10,2) NOT NULL, \`employment_type\` enum ('full_time', 'part_time', 'contract') NOT NULL DEFAULT 'full_time', PRIMARY KEY (\`user_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`employee_profiles\` ADD CONSTRAINT \`FK_986e309c16f09ce6cc47d674cfe\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`employee_profiles\` ADD CONSTRAINT \`FK_460fcd97e0cdf808147c3d03721\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`department_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`employee_profiles\` DROP FOREIGN KEY \`FK_460fcd97e0cdf808147c3d03721\``);
        await queryRunner.query(`ALTER TABLE \`employee_profiles\` DROP FOREIGN KEY \`FK_986e309c16f09ce6cc47d674cfe\``);
        await queryRunner.query(`DROP TABLE \`employee_profiles\``);
    }

}
