import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { NotificationEntity } from './notification.entity';
import { UserEntity } from '../users/user.entity';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { RecipientsService } from './recipients.service';
import { RequestsListener } from './listeners/requests.listener';
import { TasksListener } from './listeners/tasks.listener';
import { PerformanceListener } from './listeners/performance.listener';
import { PayrollListener } from './listeners/payroll.listener';
import { MiscListener } from './listeners/misc.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      UserEntity,
      EmployeeProfileEntity,
    ]),
    JwtModule.register({}),
    ConfigModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsGateway,
    RecipientsService,
    RequestsListener,
    TasksListener,
    PerformanceListener,
    PayrollListener,
    MiscListener,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}