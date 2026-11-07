import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAssignedTasksTaskIndex1793570000000 implements MigrationInterface {
  name = 'AddAssignedTasksTaskIndex1793570000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX idx_assigned_tasks_task ON assigned_tasks (task_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX idx_assigned_tasks_task ON assigned_tasks`,
    );
  }
}