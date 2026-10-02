import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveBalanceEntity } from './leave-balance.entity';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { LeaveTypeEntity } from '../leave-types/leave-type.entity';
import { LeaveBalancesService } from './leave-balances.service';
import { LeaveBalancesController } from './leave-balances.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LeaveBalanceEntity,
      EmployeeProfileEntity,
      LeaveTypeEntity,
    ]),
  ],
  controllers: [LeaveBalancesController],
  providers: [LeaveBalancesService],
  exports: [LeaveBalancesService],
})
export class LeaveBalancesModule {}