import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LoanRepaymentsService } from './loan-repayments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/enums';

@ApiBearerAuth()
@Controller('loan-repayments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_ADMIN)
export class LoanRepaymentsController {
  constructor(
    private readonly loanRepaymentsService: LoanRepaymentsService,
  ) {}

  @Get('loan/:id')
  findByLoan(@Param('id', ParseIntPipe) id: number) {
    return this.loanRepaymentsService.findByLoan(id);
  }
}