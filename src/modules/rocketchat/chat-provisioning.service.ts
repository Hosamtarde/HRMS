import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RocketChatService, RocketChatUser } from './rocketchat.service';
import {
  buildChatUsername,
  buildDepartmentChannelName,
  generateChatPassword,
} from './chat-provisioning.helper';

interface ProvisioningRow {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  chat_user_id: string | null;
  department_id: number | null;
}

@Injectable()
export class ChatProvisioningService {
  private readonly logger = new Logger(ChatProvisioningService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly rocketChat: RocketChatService,
  ) {}

  async provisionEmployee(userId: number): Promise<void> {
    if (!this.rocketChat.isEnabled()) {
      return;
    }

    try {
      const rows = await this.dataSource.manager.query<ProvisioningRow[]>(
        `SELECT u.user_id, u.first_name, u.last_name, u.email, u.chat_user_id, p.department_id
         FROM users u
         LEFT JOIN employee_profiles p ON p.user_id = u.user_id
         WHERE u.user_id = ?`,
        [userId],
      );

      const row = rows[0];
      if (!row || row.chat_user_id) {
        return;
      }

      const chatUser = await this.createChatUser(row);
      if (!chatUser) {
        return;
      }

      await this.dataSource.manager.query(
        `UPDATE users SET chat_user_id = ? WHERE user_id = ?`,
        [chatUser._id, userId],
      );

      if (row.department_id !== null) {
        await this.joinDepartmentChannel(chatUser._id, row.department_id);
      }

      this.logger.log(
        `Chat account ${chatUser.username} provisioned for user #${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Chat provisioning failed for user #${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async createChatUser(
    row: ProvisioningRow,
  ): Promise<RocketChatUser | null> {
    const name = `${row.first_name} ${row.last_name}`;
    const password = generateChatPassword();

    const first = await this.rocketChat.createUser({
      username: buildChatUsername(row.email),
      name,
      email: row.email,
      password,
    });
    if (first) {
      return first;
    }

    return this.rocketChat.createUser({
      username: buildChatUsername(row.email, row.user_id),
      name,
      email: row.email,
      password,
    });
  }

  private async joinDepartmentChannel(
    chatUserId: string,
    departmentId: number,
  ): Promise<void> {
    const channel = await this.rocketChat.ensureChannel(
      buildDepartmentChannelName(departmentId),
    );
    if (channel) {
      await this.rocketChat.addToChannel(channel._id, chatUserId);
    }
  }
}
