import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { AssignedTaskEntity } from './assigned-task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus, Role } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/helpers/pagination.helper';


@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly tasksRepository: Repository<TaskEntity>,
    @InjectRepository(AssignedTaskEntity)
    private readonly assignedTasksRepository: Repository<AssignedTaskEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(assignedBy: number, dto: CreateTaskDto): Promise<TaskEntity> {
    return this.dataSource.transaction(async (manager) => {
      const task = manager.create(TaskEntity, {
        assigned_by: assignedBy,
        task_title: dto.task_title,
        description: dto.description,
        deadline: dto.deadline,
        task_priority: dto.task_priority,
        task_status: TaskStatus.TODO,
      });
      const savedTask = await manager.save(task);

      const assignments = dto.assigned_user_ids.map((userId) =>
        manager.create(AssignedTaskEntity, {
          user_id: userId,
          task_id: savedTask.task_id,
          completion_percentage: 0,
        }),
      );
      await manager.save(assignments);

      return savedTask;
    });
  }


  async findAll(
    userId: number,
    role: Role,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<TaskEntity>> {
    const { page, limit } = paginationDto;
    const isManagerOrAdmin = role === Role.MANAGER || role === Role.HR_ADMIN;

    if (isManagerOrAdmin) {
      const [data, total] = await this.tasksRepository.findAndCount({
        relations: { assigner: true },
        order: { task_id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return buildPaginatedResult(data, total, page, limit);
    }

    const [assignments, total] = await this.assignedTasksRepository.findAndCount({
      where: { user_id: userId },
      relations: { task: true },
      order: { task_id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = assignments.map((a) => a.task);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: number): Promise<TaskEntity> {
    const task = await this.tasksRepository.findOne({
      where: { task_id: id },
      relations: { assigner: true },
    });
    if (!task) {
      throw new NotFoundException(`Task #${id} not found`);
    }
    return task;
  }

  async update(id: number, dto: UpdateTaskDto): Promise<TaskEntity> {
    const task = await this.findOne(id);
    Object.assign(task, {
      task_title: dto.task_title ?? task.task_title,
      description: dto.description ?? task.description,
      deadline: dto.deadline ?? task.deadline,
      task_priority: dto.task_priority ?? task.task_priority,
    });
    return this.tasksRepository.save(task);
  }

  async updateStatus(id: number, status: TaskStatus): Promise<TaskEntity> {
    const task = await this.findOne(id);
    task.task_status = status;
    return this.tasksRepository.save(task);
  }

  async updateCompletion(taskId: number, userId: number, percentage: number): Promise<AssignedTaskEntity> {
    const assignment = await this.assignedTasksRepository.findOne({
      where: { task_id: taskId, user_id: userId },
    });

    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this task');
    }

    assignment.completion_percentage = percentage;
    return this.assignedTasksRepository.save(assignment);
  }

  async remove(id: number): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }
}