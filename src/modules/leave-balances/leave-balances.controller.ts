import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeaveBalancesService } from './leave-balances.service';
import { UpdateLeaveBalanceDto } from './dto/update-leave-balance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { QueryLeaveBalancesDto } from './dto/query-leave-balances.dto';

@ApiBearerAuth()
@Controller('leave-balances')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_ADMIN)
export class LeaveBalancesController {
  constructor(private readonly leaveBalancesService: LeaveBalancesService) {}

  @Get('me')
  @Roles(Role.EMPLOYEE, Role.MANAGER, Role.HR_ADMIN)
  @ApiQuery({ name: 'year', required: false, example: 2026 })
  findMine(
    @CurrentUser('user_id') userId: number,
    @Query('year') year?: string,
  ) {
    const targetYear = year ? Number(year) : new Date().getFullYear();
    return this.leaveBalancesService.findByUser(userId, targetYear);
  }

  @Get()
  findAll(@Query() query: QueryLeaveBalancesDto) {
    return this.leaveBalancesService.findAll(query, query.year);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.leaveBalancesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeaveBalanceDto,
  ) {
    return this.leaveBalancesService.update(id, dto);
  }

  @Post('calculate')
  @ApiQuery({ name: 'year', required: false, example: 2026 })
  calculate(@Query('year') year?: string) {
    const targetYear = year ? Number(year) : new Date().getFullYear();
    return this.leaveBalancesService.calculateForYear(targetYear);
  }


}