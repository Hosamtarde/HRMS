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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENTS } from '../../common/events/notification-events';
import { OrgChartService } from '../org-chart/org-chart.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly tasksRepository: Repository<TaskEntity>,
    @InjectRepository(AssignedTaskEntity)
    private readonly assignedTasksRepository: Repository<AssignedTaskEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly orgChartService: OrgChartService,
  ) {}

  async create(assignedBy: number, dto: CreateTaskDto): Promise<TaskEntity> {
    const savedTask = await this.dataSource.transaction<TaskEntity>(async (manager) => {
      const task = manager.create(TaskEntity, {
        assigned_by: assignedBy,
        task_title: dto.task_title,
        description: dto.description,
        deadline: dto.deadline,
        task_priority: dto.task_priority,
        task_status: TaskStatus.TODO,
      });
      const created = await manager.save(task);

      const assignments = dto.assigned_user_ids.map((userId) =>
        manager.create(AssignedTaskEntity, {
          user_id: userId,
          task_id: created.task_id,
          completion_percentage: 0,
        }),
      );
      await manager.save(assignments);

      return created;
    });

    this.eventEmitter.emit(NOTIFICATION_EVENTS.TASK_ASSIGNED, {
      taskId: savedTask.task_id,
      title: savedTask.task_title,
      userIds: dto.assigned_user_ids,
      assignedBy,
    });

    return savedTask;
  }

  async findAll(
    userId: number,
    role: Role,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<TaskEntity>> {
    const { page, limit } = paginationDto;

    if (role === Role.HR_ADMIN) {
      const [data, total] = await this.tasksRepository.findAndCount({
        relations: { assigner: true },
        order: { task_id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return buildPaginatedResult(data, total, page, limit);
    }

    if (role === Role.MANAGER) {
      const scopeIds = await this.orgChartService.getSubtreeIds(userId);
      const ids = scopeIds.length ? scopeIds : [userId];

      const [data, total] = await this.tasksRepository
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.assigner', 'assigner')
        .where(
          `(t.assigned_by = :userId OR EXISTS (
             SELECT 1 FROM assigned_tasks at
             WHERE at.task_id = t.task_id AND at.user_id IN (:...ids)
           ))`,
          { userId, ids },
        )
        .orderBy('t.task_id', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

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

  async findOne(id: number, viewerId: number, role: Role): Promise<TaskEntity> {
    const task = await this.findTaskOrFail(id);
    await this.assertCanView(task, viewerId, role);
    return task;
  }

  async update(
    id: number,
    dto: UpdateTaskDto,
    actorId: number,
    role: Role,
  ): Promise<TaskEntity> {
    const task = await this.findTaskOrFail(id);
    await this.assertCanManage(task, actorId, role);

    Object.assign(task, {
      task_title: dto.task_title ?? task.task_title,
      description: dto.description ?? task.description,
      deadline: dto.deadline ?? task.deadline,
      task_priority: dto.task_priority ?? task.task_priority,
    });
    return this.tasksRepository.save(task);
  }

  async updateStatus(
    id: number,
    status: TaskStatus,
    actorId: number,
    role: Role,
  ): Promise<TaskEntity> {
    const task = await this.findTaskOrFail(id);
    await this.assertCanManage(task, actorId, role);

    task.task_status = status;
    const saved = await this.tasksRepository.save(task);

    const userIds = await this.findAssigneeIds(id);

    this.eventEmitter.emit(NOTIFICATION_EVENTS.TASK_STATUS_CHANGED, {
      taskId: id,
      title: saved.task_title,
      userIds,
      status,
    });

    return saved;
  }

  async updateCompletion(taskId: number, userId: number, percentage: number): Promise<AssignedTaskEntity> {
    const assignment = await this.assignedTasksRepository.findOne({
      where: { task_id: taskId, user_id: userId },
    });

    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this task');
    }

    assignment.completion_percentage = percentage;
    const saved = await this.assignedTasksRepository.save(assignment);

    if (percentage === 100) {
      const all = await this.assignedTasksRepository.find({
        where: { task_id: taskId },
      });
      const everyoneDone = all.every(
        (row) => Number(row.completion_percentage) === 100,
      );

      if (everyoneDone) {
        const task = await this.findTaskOrFail(taskId);
        this.eventEmitter.emit(NOTIFICATION_EVENTS.TASK_COMPLETED, {
          taskId,
          title: task.task_title,
          assignerId: task.assigned_by,
        });
      }
    }

    return saved;
  }

  async remove(id: number, actorId: number, role: Role): Promise<void> {
    const task = await this.findTaskOrFail(id);
    await this.assertCanManage(task, actorId, role);
    await this.tasksRepository.remove(task);
  }

  private async findTaskOrFail(id: number): Promise<TaskEntity> {
    const task = await this.tasksRepository.findOne({
      where: { task_id: id },
      relations: { assigner: true },
    });
    if (!task) {
      throw new NotFoundException(`Task #${id} not found`);
    }
    return task;
  }

  private async findAssigneeIds(taskId: number): Promise<number[]> {
    const rows = await this.assignedTasksRepository.find({
      where: { task_id: taskId },
      select: { user_id: true },
    });
    return rows.map((row) => row.user_id);
  }

  private async assertCanView(
    task: TaskEntity,
    userId: number,
    role: Role,
  ): Promise<void> {
    if (role === Role.HR_ADMIN || task.assigned_by === userId) {
      return;
    }

    const assigneeIds = await this.findAssigneeIds(task.task_id);
    if (assigneeIds.includes(userId)) {
      return;
    }

    if (role === Role.MANAGER && (await this.hasScopeOver(assigneeIds, userId))) {
      return;
    }

    throw new ForbiddenException('You do not have access to this task');
  }

  private async assertCanManage(
    task: TaskEntity,
    userId: number,
    role: Role,
  ): Promise<void> {
    if (role === Role.HR_ADMIN || task.assigned_by === userId) {
      return;
    }

    const assigneeIds = await this.findAssigneeIds(task.task_id);
    if (role === Role.MANAGER && (await this.hasScopeOver(assigneeIds, userId))) {
      return;
    }

    throw new ForbiddenException(
      'This task belongs to employees outside your scope',
    );
  }

  private async hasScopeOver(
    assigneeIds: number[],
    managerId: number,
  ): Promise<boolean> {
    if (!assigneeIds.length) {
      return false;
    }
    const scopeIds = await this.orgChartService.getSubtreeIds(managerId);
    return assigneeIds.some((id) => scopeIds.includes(id));
  }
}