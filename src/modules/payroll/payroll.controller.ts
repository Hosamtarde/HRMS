import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/enums';

@ApiBearerAuth()
@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_ADMIN) 
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  
  @Post('generate')
  generate(@Body() dto: GeneratePayrollDto) {
    return this.payrollService.generate(dto);
  }


  @Get()
  findAll() {
    return this.payrollService.findAll();
  }

  
  @Get('employee/:id')
  findByEmployee(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.findByEmployee(id);
  }
}