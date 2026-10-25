import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReportIndexes1792951929309 implements MigrationInterface {
    name = 'AddReportIndexes1792951929309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX \`IDX_ea65ccd7b401c87400170af2d8\` ON \`attendance_records\` (\`user_id\`, \`attendance_date\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_f6c1efb1249c28a530ae2ee877\` ON \`leave_balances\` (\`year\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_534a910bbe9b9aa2d32da21ea3\` ON \`payroll_records\` (\`salary_month\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_a7009981bf2b202ba0afdacc0d\` ON \`recruitment\` (\`submission_date\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_aa372a806a9d3c49bf83f61507\` ON \`tasks\` (\`deadline\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_aa372a806a9d3c49bf83f61507\` ON \`tasks\``);
        await queryRunner.query(`DROP INDEX \`IDX_a7009981bf2b202ba0afdacc0d\` ON \`recruitment\``);
        await queryRunner.query(`DROP INDEX \`IDX_534a910bbe9b9aa2d32da21ea3\` ON \`payroll_records\``);
        await queryRunner.query(`DROP INDEX \`IDX_f6c1efb1249c28a530ae2ee877\` ON \`leave_balances\``);
        await queryRunner.query(`DROP INDEX \`IDX_ea65ccd7b401c87400170af2d8\` ON \`attendance_records\``);
    }

}
