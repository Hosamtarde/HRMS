import { MigrationInterface, QueryRunner } from 'typeorm';

export class LinkRequestsToLeaveTypes1790703659664 implements MigrationInterface {
  name = 'LinkRequestsToLeaveTypes1790703659664';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ١. عمود جديد فارغ — العمود القديم ما زال موجوداً ببياناته
    await queryRunner.query(
      `ALTER TABLE \`requests\` ADD \`leave_type_id\` int NULL`,
    );

    // ٢. نقل البيانات: كل قيمة enum تُربط بصفّها المقابل بالاسم
    await queryRunner.query(`
      UPDATE \`requests\` r
      JOIN \`leave_types\` lt ON lt.\`type_name\` = CASE r.\`leave_type\`
          WHEN 'annual'    THEN 'Annual Leave'
          WHEN 'sick'      THEN 'Sick Leave'
          WHEN 'emergency' THEN 'Emergency Leave'
          WHEN 'unpaid'    THEN 'Unpaid Leave'
        END
      SET r.\`leave_type_id\` = lt.\`leave_type_id\`
      WHERE r.\`leave_type\` IS NOT NULL
    `);

    // ٣. الآن الحذف آمن — البيانات انتقلت
    await queryRunner.query(
      `ALTER TABLE \`requests\` DROP COLUMN \`leave_type\``,
    );

    // ٤. الربط الرسمي
    await queryRunner.query(`
      ALTER TABLE \`requests\`
      ADD CONSTRAINT \`FK_2655833f1b53e3643f9855461cc\`
      FOREIGN KEY (\`leave_type_id\`) REFERENCES \`leave_types\`(\`leave_type_id\`)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`requests\` DROP FOREIGN KEY \`FK_2655833f1b53e3643f9855461cc\``,
    );

    await queryRunner.query(`
      ALTER TABLE \`requests\`
      ADD \`leave_type\` enum ('annual', 'sick', 'emergency', 'unpaid') NULL
    `);

    await queryRunner.query(`
      UPDATE \`requests\` r
      JOIN \`leave_types\` lt ON lt.\`leave_type_id\` = r.\`leave_type_id\`
      SET r.\`leave_type\` = CASE lt.\`type_name\`
          WHEN 'Annual Leave'    THEN 'annual'
          WHEN 'Sick Leave'      THEN 'sick'
          WHEN 'Emergency Leave' THEN 'emergency'
          WHEN 'Unpaid Leave'    THEN 'unpaid'
        END
      WHERE r.\`leave_type_id\` IS NOT NULL
    `);

    await queryRunner.query(
      `ALTER TABLE \`requests\` DROP COLUMN \`leave_type_id\``,
    );
  }
}