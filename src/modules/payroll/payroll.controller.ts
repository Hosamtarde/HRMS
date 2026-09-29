import { Body, Controller, Get, Param,Query,Put, Delete, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { GeneratePayrollDto } from './dto/generate-payroll.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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
  findAll(@Query() paginationDto: PaginationDto) {
    return this.payrollService.findAll(paginationDto);
  }

  
  @Get('employee/:id')
  findByEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.payrollService.findByEmployee(id, paginationDto);
  }

    @Get('me')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN)
  findMine(
    @CurrentUser('user_id') userId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.payrollService.findByEmployee(userId, paginationDto);
  }

    @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePayrollDto,
  ) {
    return this.payrollService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.payrollService.remove(id);
  }
}