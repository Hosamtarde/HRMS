import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationType } from '../../common/enums/enums';

export interface NotificationPushPayload {
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*' },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private readonly server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);

    if (!token) {
      this.logger.warn(`Socket ${client.id} rejected: no token provided`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: number }>(
        token,
        { secret: this.config.get<string>('JWT_SECRET')! },
      );

      client.data.userId = payload.sub;
      await client.join(this.roomOf(payload.sub));

      this.logger.log(
        `User #${payload.sub} subscribed to notifications (socket ${client.id})`,
      );
    } catch {
      this.logger.warn(`Socket ${client.id} rejected: invalid token`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId as number | undefined;

    if (userId) {
      this.logger.log(
        `User #${userId} unsubscribed from notifications (socket ${client.id})`,
      );
    }
  }

  pushToUser(userId: number, payload: NotificationPushPayload): void {
    this.server.to(this.roomOf(userId)).emit('notification', payload);
  }

  pushToUsers(userIds: number[], payload: NotificationPushPayload): void {
    if (userIds.length === 0) {
      return;
    }

    this.server
      .to(userIds.map((id) => this.roomOf(id)))
      .emit('notification', payload);
  }

  private extractToken(client: Socket): string | null {
    const fromAuth = client.handshake.auth?.token as string | undefined;

    if (fromAuth) {
      return fromAuth.replace(/^Bearer\s+/i, '');
    }

    const header = client.handshake.headers.authorization;

    if (typeof header === 'string') {
      return header.replace(/^Bearer\s+/i, '');
    }

    return null;
  }

  private roomOf(userId: number): string {
    return `user:${userId}`;
  }
}