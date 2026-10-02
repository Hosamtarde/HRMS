import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedLeaveTypes1790702573220 implements MigrationInterface {
  name = 'SeedLeaveTypes1790702573220';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`leave_types\` (\`type_name\`, \`payment_type\`, \`default_days\`) VALUES
        ('إجازة سنوية', 'paid', 21),
        ('إجازة مرضية', 'paid', 14),
        ('إجازة اضطرارية', 'paid', 5),
        ('إجازة بدون راتب', 'unpaid', 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`leave_types\`
      WHERE \`type_name\` IN (
        'إجازة سنوية', 'إجازة مرضية', 'إجازة اضطرارية', 'إجازة بدون راتب'
      )
    `);
  }
}