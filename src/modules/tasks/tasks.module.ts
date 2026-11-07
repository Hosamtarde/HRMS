import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskEntity } from './task.entity';
import { AssignedTaskEntity } from './assigned-task.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { OrgChartModule } from '../org-chart/org-chart.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TaskEntity, AssignedTaskEntity]),
    OrgChartModule,
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}