import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPerformanceTables1791659106433 implements MigrationInterface {
    name = 'AddPerformanceTables1791659106433'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`criteria_categories\` (\`category_id\` int NOT NULL AUTO_INCREMENT, \`category_name\` varchar(100) NOT NULL, \`description\` varchar(255) NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_6eec0d239130381d73d7f3c639\` (\`category_name\`), PRIMARY KEY (\`category_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`plan_criteria\` (\`criteria_id\` int NOT NULL AUTO_INCREMENT, \`plan_id\` int NOT NULL, \`category_id\` int NOT NULL, \`criteria_text\` varchar(255) NOT NULL, \`weight\` decimal(5,2) NOT NULL, \`max_score\` int NOT NULL DEFAULT '5', \`display_order\` int NOT NULL DEFAULT '0', INDEX \`IDX_35a79a75ec8ebebc3ff8a8890a\` (\`plan_id\`, \`display_order\`), PRIMARY KEY (\`criteria_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`evaluation_plans\` (\`plan_id\` int NOT NULL AUTO_INCREMENT, \`plan_name\` varchar(150) NOT NULL, \`description\` text NULL, \`department_id\` int NULL, \`created_by\` int NOT NULL, \`period_start\` date NOT NULL, \`period_end\` date NOT NULL, \`submission_start\` date NOT NULL, \`submission_end\` date NOT NULL, \`plan_status\` enum ('draft', 'active', 'closed') NOT NULL DEFAULT 'draft', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`plan_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`performance_reviews\` (\`review_id\` int NOT NULL AUTO_INCREMENT, \`plan_id\` int NOT NULL, \`reviewed_user_id\` int NOT NULL, \`reviewed_by\` int NULL, \`review_status\` enum ('pending', 'submitted') NOT NULL DEFAULT 'pending', \`total_score\` decimal(6,2) NULL, \`final_percentage\` decimal(5,2) NULL, \`reviewer_comment\` text NULL, \`submitted_at\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_c6d04198740acb259d5eafaca8\` (\`plan_id\`, \`review_status\`), INDEX \`IDX_e15324f3bc47909337dd1e6e2d\` (\`reviewed_user_id\`, \`review_status\`), UNIQUE INDEX \`IDX_cb622b3a24ed8796322b49d7f0\` (\`plan_id\`, \`reviewed_user_id\`), PRIMARY KEY (\`review_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`evaluation_scores\` (\`review_id\` int NOT NULL, \`criteria_id\` int NOT NULL, \`score\` int NOT NULL, \`note\` varchar(255) NULL, PRIMARY KEY (\`review_id\`, \`criteria_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`plan_criteria\` ADD CONSTRAINT \`FK_83a57b95b17894dd4e08270d9ba\` FOREIGN KEY (\`plan_id\`) REFERENCES \`evaluation_plans\`(\`plan_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`plan_criteria\` ADD CONSTRAINT \`FK_dabaf6ca67753c2fb9b75bbd3e0\` FOREIGN KEY (\`category_id\`) REFERENCES \`criteria_categories\`(\`category_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`evaluation_plans\` ADD CONSTRAINT \`FK_c4587821ecf7e357116d4d572e8\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\`(\`department_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`evaluation_plans\` ADD CONSTRAINT \`FK_f67b2786a7610bd7555d556556b\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`performance_reviews\` ADD CONSTRAINT \`FK_b62ecda71063f5679b16b6e88e9\` FOREIGN KEY (\`plan_id\`) REFERENCES \`evaluation_plans\`(\`plan_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`performance_reviews\` ADD CONSTRAINT \`FK_e775ec60c412c80359d978661ae\` FOREIGN KEY (\`reviewed_user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`performance_reviews\` ADD CONSTRAINT \`FK_bb30a73cf5bd122806e12661d28\` FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`evaluation_scores\` ADD CONSTRAINT \`FK_fc4ad59362e0a633868648fcc4c\` FOREIGN KEY (\`review_id\`) REFERENCES \`performance_reviews\`(\`review_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`evaluation_scores\` ADD CONSTRAINT \`FK_988f2dd5df0adcfdabd4e878b41\` FOREIGN KEY (\`criteria_id\`) REFERENCES \`plan_criteria\`(\`criteria_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`evaluation_scores\` DROP FOREIGN KEY \`FK_988f2dd5df0adcfdabd4e878b41\``);
        await queryRunner.query(`ALTER TABLE \`evaluation_scores\` DROP FOREIGN KEY \`FK_fc4ad59362e0a633868648fcc4c\``);
        await queryRunner.query(`ALTER TABLE \`performance_reviews\` DROP FOREIGN KEY \`FK_bb30a73cf5bd122806e12661d28\``);
        await queryRunner.query(`ALTER TABLE \`performance_reviews\` DROP FOREIGN KEY \`FK_e775ec60c412c80359d978661ae\``);
        await queryRunner.query(`ALTER TABLE \`performance_reviews\` DROP FOREIGN KEY \`FK_b62ecda71063f5679b16b6e88e9\``);
        await queryRunner.query(`ALTER TABLE \`evaluation_plans\` DROP FOREIGN KEY \`FK_f67b2786a7610bd7555d556556b\``);
        await queryRunner.query(`ALTER TABLE \`evaluation_plans\` DROP FOREIGN KEY \`FK_c4587821ecf7e357116d4d572e8\``);
        await queryRunner.query(`ALTER TABLE \`plan_criteria\` DROP FOREIGN KEY \`FK_dabaf6ca67753c2fb9b75bbd3e0\``);
        await queryRunner.query(`ALTER TABLE \`plan_criteria\` DROP FOREIGN KEY \`FK_83a57b95b17894dd4e08270d9ba\``);
        await queryRunner.query(`DROP TABLE \`evaluation_scores\``);
        await queryRunner.query(`DROP INDEX \`IDX_cb622b3a24ed8796322b49d7f0\` ON \`performance_reviews\``);
        await queryRunner.query(`DROP INDEX \`IDX_e15324f3bc47909337dd1e6e2d\` ON \`performance_reviews\``);
        await queryRunner.query(`DROP INDEX \`IDX_c6d04198740acb259d5eafaca8\` ON \`performance_reviews\``);
        await queryRunner.query(`DROP TABLE \`performance_reviews\``);
        await queryRunner.query(`DROP TABLE \`evaluation_plans\``);
        await queryRunner.query(`DROP INDEX \`IDX_35a79a75ec8ebebc3ff8a8890a\` ON \`plan_criteria\``);
        await queryRunner.query(`DROP TABLE \`plan_criteria\``);
        await queryRunner.query(`DROP INDEX \`IDX_6eec0d239130381d73d7f3c639\` ON \`criteria_categories\``);
        await queryRunner.query(`DROP TABLE \`criteria_categories\``);
    }

}
