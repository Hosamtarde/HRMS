import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { RecipientsService } from '../recipients.service';
import { NOTIFICATION_EVENTS } from '../../../common/events/notification-events';
import { NotificationType } from '../../../common/enums/enums';

const STATUS_LABELS: Record<string, string> = {
  todo: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  done: 'منجزة',
  completed: 'منجزة',
  cancelled: 'ملغاة',
};

export interface TaskAssignedEvent {
  taskId: number;
  title: string;
  userIds: number[];
  assignedBy: number;
}

export interface TaskStatusEvent {
  taskId: number;
  title: string;
  userIds: number[];
  status: string;
}

export interface TaskCompletedEvent {
  taskId: number;
  title: string;
  assignerId: number;
}

@Injectable()
export class TasksListener {
  private readonly logger = new Logger(TasksListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly recipients: RecipientsService,
  ) {}

  @OnEvent(NOTIFICATION_EVENTS.TASK_ASSIGNED)
  async onAssigned(event: TaskAssignedEvent) {
    try {
      const assigner = await this.recipients.getName(event.assignedBy);

      await this.notificationsService.createMany(
        event.userIds.map((userId) => ({
          user_id: userId,
          type: NotificationType.TASK_ASSIGNED,
          title: 'مهمة جديدة',
          message: `كلّفك ${assigner} بمهمة "${event.title}".`,
          link: `/tasks/${event.taskId}`,
        })),
      );
    } catch (error) {
      this.logger.error(
        `Could not notify assignees of task #${event.taskId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.TASK_STATUS_CHANGED)
  async onStatusChanged(event: TaskStatusEvent) {
    try {
      const label = STATUS_LABELS[event.status] ?? event.status;

      await this.notificationsService.createMany(
        event.userIds.map((userId) => ({
          user_id: userId,
          type: NotificationType.TASK_STATUS_CHANGED,
          title: 'تغيّرت حالة مهمة',
          message: `أصبحت المهمة "${event.title}" ${label}.`,
          link: `/tasks/${event.taskId}`,
        })),
      );
    } catch (error) {
      this.logger.error(
        `Could not notify assignees about status of task #${event.taskId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.TASK_COMPLETED)
  async onCompleted(event: TaskCompletedEvent) {
    try {
      await this.notificationsService.create({
        user_id: event.assignerId,
        type: NotificationType.TASK_COMPLETED,
        title: 'اكتملت مهمة',
        message: `أنهى جميع المكلّفين المهمة "${event.title}".`,
        link: `/tasks/${event.taskId}`,
      });
    } catch (error) {
      this.logger.error(
        `Could not notify assigner of task #${event.taskId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}