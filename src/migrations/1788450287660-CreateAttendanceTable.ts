import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAttendanceTable1788450287660 implements MigrationInterface {
    name = 'CreateAttendanceTable1788450287660'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`attendance_records\` (\`attendance_id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`check_in_time\` time NULL, \`check_out_time\` time NULL, \`working_hours\` float NULL, \`attendance_status\` enum ('present', 'absent', 'late', 'on_leave') NOT NULL DEFAULT 'present', \`attendance_date\` date NOT NULL, PRIMARY KEY (\`attendance_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`attendance_records\` ADD CONSTRAINT \`FK_10e9fc7100cb48ace47a91ee1ce\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`attendance_records\` DROP FOREIGN KEY \`FK_10e9fc7100cb48ace47a91ee1ce\``);
        await queryRunner.query(`DROP TABLE \`attendance_records\``);
    }

}
