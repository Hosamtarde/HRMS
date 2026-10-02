import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLeaveBalancesTable1790946527059 implements MigrationInterface {
    name = 'CreateLeaveBalancesTable1790946527059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`leave_balances\` (\`balance_id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`leave_type_id\` int NOT NULL, \`year\` int NOT NULL, \`total_days\` decimal(5,1) NOT NULL DEFAULT '0.0', \`carried_over\` decimal(5,1) NOT NULL DEFAULT '0.0', \`used_days\` decimal(5,1) NOT NULL DEFAULT '0.0', \`is_manual\` tinyint NOT NULL DEFAULT 0, UNIQUE INDEX \`IDX_c96727e7b6f0420af2593ca754\` (\`user_id\`, \`leave_type_id\`, \`year\`), PRIMARY KEY (\`balance_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`leave_balances\` ADD CONSTRAINT \`FK_89ffc3253557b60d4d979ffe50c\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`leave_balances\` ADD CONSTRAINT \`FK_d64da0a991d2f4d23d86031530c\` FOREIGN KEY (\`leave_type_id\`) REFERENCES \`leave_types\`(\`leave_type_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`leave_balances\` DROP FOREIGN KEY \`FK_d64da0a991d2f4d23d86031530c\``);
        await queryRunner.query(`ALTER TABLE \`leave_balances\` DROP FOREIGN KEY \`FK_89ffc3253557b60d4d979ffe50c\``);
        await queryRunner.query(`DROP INDEX \`IDX_c96727e7b6f0420af2593ca754\` ON \`leave_balances\``);
        await queryRunner.query(`DROP TABLE \`leave_balances\``);
    }

}
