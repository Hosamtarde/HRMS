import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveTypeEntity } from './leave-type.entity';
import { LeaveTypesService } from './leave-types.service';
import { LeaveTypesController } from './leave-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveTypeEntity])],
  controllers: [LeaveTypesController],
  providers: [LeaveTypesService],
  exports: [LeaveTypesService],
})
export class LeaveTypesModule {}