import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './notification.entity';
import { UserEntity } from '../users/user.entity';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { NotificationsService } from './notifications.service';
import { RecipientsService } from './recipients.service';
import { NotificationsController } from './notifications.controller';
import { RequestsListener } from './listeners/requests.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      UserEntity,
      EmployeeProfileEntity,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, RecipientsService, RequestsListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}