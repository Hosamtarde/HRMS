import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollEntity } from './payroll.entity';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { RequestEntity } from '../requests/request.entity';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PayrollEntity, EmployeeProfileEntity, RequestEntity]),
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}