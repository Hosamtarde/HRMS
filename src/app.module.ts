import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { RequestsModule } from './modules/requests/requests.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { ActivityLogInterceptor } from './common/interceptors/activity-log.interceptor';
import { LeaveTypesModule } from './modules/leave-types/leave-types.module';
import { LeaveBalancesModule } from './modules/leave-balances/leave-balances.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        timezone: 'Z',
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    UsersModule,
    AuthModule,
    DepartmentsModule,
    AttendanceModule,
    EmployeesModule,
    RequestsModule,
    RecruitmentModule,
    TasksModule,
    PayrollModule,
    ActivityLogsModule,
    LeaveTypesModule,
    LeaveBalancesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ActivityLogInterceptor },
  ],
  
})
export class AppModule {}