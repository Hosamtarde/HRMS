import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayrollEntity } from './payroll.entity';
import { EmployeeProfileEntity } from '../employees/employee-profile.entity';
import { RequestEntity } from '../requests/request.entity';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { LoanRepaymentsModule } from '../loan-repayments/loan-repayments.module';
import { RequestsModule } from '../requests/requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollEntity,
      EmployeeProfileEntity,
      RequestEntity,
    ]),
    LoanRepaymentsModule,
    RequestsModule,
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}