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

interface MembershipRow {
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

  async syncDepartment(
    userId: number,
    previousDepartmentId: number | null,
  ): Promise<void> {
    if (!this.rocketChat.isEnabled()) {
      return;
    }

    try {
      const row = await this.findMembershipRow(userId);
      if (!row) {
        return;
      }

      if (!row.chat_user_id) {
        await this.provisionEmployee(userId);
        return;
      }

      if (row.department_id === previousDepartmentId) {
        return;
      }

      if (previousDepartmentId !== null) {
        await this.leaveDepartmentChannel(
          row.chat_user_id,
          previousDepartmentId,
        );
      }
      if (row.department_id !== null) {
        await this.joinDepartmentChannel(row.chat_user_id, row.department_id);
      }

      this.logger.log(`Chat channel membership updated for user #${userId}`);
    } catch (error) {
      this.logger.error(
        `Chat department sync failed for user #${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async deactivateEmployee(userId: number): Promise<void> {
    if (!this.rocketChat.isEnabled()) {
      return;
    }

    try {
      const row = await this.findMembershipRow(userId);
      if (!row || !row.chat_user_id) {
        return;
      }

      if (row.department_id !== null) {
        await this.leaveDepartmentChannel(row.chat_user_id, row.department_id);
      }
      await this.rocketChat.setUserActive(row.chat_user_id, false);

      this.logger.log(`Chat account deactivated for user #${userId}`);
    } catch (error) {
      this.logger.error(
        `Chat deactivation failed for user #${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async findMembershipRow(
    userId: number,
  ): Promise<MembershipRow | null> {
    const rows = await this.dataSource.manager.query<MembershipRow[]>(
      `SELECT u.chat_user_id, p.department_id
       FROM users u
       LEFT JOIN employee_profiles p ON p.user_id = u.user_id
       WHERE u.user_id = ?`,
      [userId],
    );
    return rows[0] ?? null;
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

  private async leaveDepartmentChannel(
    chatUserId: string,
    departmentId: number,
  ): Promise<void> {
    const channel = await this.rocketChat.getChannelByName(
      buildDepartmentChannelName(departmentId),
    );
    if (channel) {
      await this.rocketChat.removeFromChannel(channel._id, chatUserId);
    }
  }
}
