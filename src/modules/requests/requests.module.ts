import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestEntity } from './request.entity';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { LeaveTypesModule } from '../leave-types/leave-types.module';
import { LeaveBalancesModule } from '../leave-balances/leave-balances.module';

@Module({
  imports: [LeaveTypesModule,LeaveBalancesModule,TypeOrmModule.forFeature([RequestEntity])],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}