import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRecruitmentTable1789056216599 implements MigrationInterface {
    name = 'CreateRecruitmentTable1789056216599'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`recruitment\` (\`application_id\` int NOT NULL AUTO_INCREMENT, \`applicant_name\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`phone_number\` varchar(20) NULL, \`cv_file\` varchar(255) NOT NULL, \`applied_position\` varchar(100) NOT NULL, \`application_status\` enum ('pending', 'shortlisted', 'interview_scheduled', 'accepted', 'rejected') NOT NULL DEFAULT 'pending', \`submission_date\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`application_id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`recruitment\``);
    }

}
