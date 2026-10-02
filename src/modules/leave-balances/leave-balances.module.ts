import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveBalanceEntity } from './leave-balance.entity';
import { LeaveBalancesService } from './leave-balances.service';
import { LeaveBalancesController } from './leave-balances.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveBalanceEntity])],
  controllers: [LeaveBalancesController],
  providers: [LeaveBalancesService],
  exports: [LeaveBalancesService],
})
export class LeaveBalancesModule {}