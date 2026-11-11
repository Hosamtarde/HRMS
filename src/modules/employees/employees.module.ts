import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/user.entity';
import { EmployeeProfileEntity } from './employee-profile.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { RocketChatModule } from '../rocketchat/rocketchat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, EmployeeProfileEntity]),
    RocketChatModule,
  ],
  providers: [EmployeesService],
  exports: [EmployeesService],
  controllers: [EmployeesController],
})
export class EmployeesModule {}
