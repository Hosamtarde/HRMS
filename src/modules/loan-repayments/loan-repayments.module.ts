import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanRepaymentEntity } from './loan-repayment.entity';
import { LoanRepaymentsService } from './loan-repayments.service';
import { LoanRepaymentsController } from './loan-repayments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoanRepaymentEntity])],
  controllers: [LoanRepaymentsController],
  providers: [LoanRepaymentsService],
  exports: [LoanRepaymentsService],
})
export class LoanRepaymentsModule {}