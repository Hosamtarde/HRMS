import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RocketChatService } from './rocketchat.service';
import {
  buildChatMessage,
  ChatNotificationContent,
} from './chat-message.helper';

export interface ChatNotificationItem extends ChatNotificationContent {
  user_id: number;
}

interface ChatAccountRow {
  user_id: number;
  chat_user_id: string;
}

interface DeliveryJob {
  chatUserId: string;
  text: string;
}

@Injectable()
export class ChatNotificationService {
  private readonly logger = new Logger(ChatNotificationService.name);
  private readonly batchSize = 5;
  private readonly frontendUrl: string;

  constructor(
    config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly rocketChat: RocketChatService,
  ) {
    this.frontendUrl = config.get<string>('APP_FRONTEND_URL') ?? '';
  }

  async deliver(items: ChatNotificationItem[]): Promise<void> {
    if (!items.length || !this.rocketChat.isEnabled()) {
      return;
    }

    try {
      const userIds = [...new Set(items.map((item) => item.user_id))];
      const placeholders = userIds.map(() => '?').join(', ');
      const rows = await this.dataSource.manager.query<ChatAccountRow[]>(
        `SELECT user_id, chat_user_id FROM users WHERE user_id IN (${placeholders}) AND chat_user_id IS NOT NULL AND status = true`,
        userIds,
      );

      const accounts = new Map<number, string>();
      for (const row of rows) {
        accounts.set(Number(row.user_id), row.chat_user_id);
      }

      const jobs: DeliveryJob[] = [];
      for (const item of items) {
        const chatUserId = accounts.get(item.user_id);
        if (chatUserId) {
          jobs.push({
            chatUserId,
            text: buildChatMessage(item, this.frontendUrl),
          });
        }
      }

      for (let start = 0; start < jobs.length; start += this.batchSize) {
        const batch = jobs.slice(start, start + this.batchSize);
        await Promise.all(
          batch.map((job) =>
            this.rocketChat.sendDirectMessageToUserId(job.chatUserId, job.text),
          ),
        );
      }
    } catch (error) {
      this.logger.error(
        `Chat delivery failed for ${items.length} notification(s): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
