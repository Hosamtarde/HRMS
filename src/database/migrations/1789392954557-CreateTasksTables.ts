import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTasksTables1789392954557 implements MigrationInterface {
    name = 'CreateTasksTables1789392954557'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tasks\` (\`task_id\` int NOT NULL AUTO_INCREMENT, \`assigned_by\` int NOT NULL, \`task_title\` varchar(150) NOT NULL, \`description\` text NOT NULL, \`deadline\` date NOT NULL, \`task_priority\` enum ('low', 'medium', 'high') NOT NULL DEFAULT 'medium', \`task_status\` enum ('to-do', 'in_progress', 'completed') NOT NULL DEFAULT 'to-do', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`task_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`assigned_tasks\` (\`user_id\` int NOT NULL, \`task_id\` int NOT NULL, \`assigned_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`completion_percentage\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`user_id\`, \`task_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tasks\` ADD CONSTRAINT \`FK_a8a7b3b66c0b0fee5da777fea96\` FOREIGN KEY (\`assigned_by\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`assigned_tasks\` ADD CONSTRAINT \`FK_7c28f89fab1d69b7c9c7dbccf23\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`assigned_tasks\` ADD CONSTRAINT \`FK_13886070d1cf0a0712509a2247f\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\`(\`task_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`assigned_tasks\` DROP FOREIGN KEY \`FK_13886070d1cf0a0712509a2247f\``);
        await queryRunner.query(`ALTER TABLE \`assigned_tasks\` DROP FOREIGN KEY \`FK_7c28f89fab1d69b7c9c7dbccf23\``);
        await queryRunner.query(`ALTER TABLE \`tasks\` DROP FOREIGN KEY \`FK_a8a7b3b66c0b0fee5da777fea96\``);
        await queryRunner.query(`DROP TABLE \`assigned_tasks\``);
        await queryRunner.query(`DROP TABLE \`tasks\``);
    }

}
