import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1788192674567 implements MigrationInterface {
    name = 'InitialSchema1788192674567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`user_id\` int NOT NULL AUTO_INCREMENT, \`first_name\` varchar(100) NOT NULL, \`last_name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('applicant', 'employee', 'manager', 'hr_admin') NOT NULL DEFAULT 'employee', \`phone_number\` varchar(20) NULL, \`profile_image\` varchar(255) NULL, \`status\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`user_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`departments\` (\`department_id\` int NOT NULL AUTO_INCREMENT, \`department_name\` varchar(100) NOT NULL, \`manager_id\` int NULL, PRIMARY KEY (\`department_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`departments\` ADD CONSTRAINT \`FK_ef8a4fb89ff96bbe98f1798798c\` FOREIGN KEY (\`manager_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`departments\` DROP FOREIGN KEY \`FK_ef8a4fb89ff96bbe98f1798798c\``);
        await queryRunner.query(`DROP TABLE \`departments\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
