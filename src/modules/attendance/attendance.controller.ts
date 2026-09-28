import { Controller, Get, Post, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  
  @Post('check-in')
  checkIn(@CurrentUser('user_id') userId: number) {
    return this.attendanceService.checkIn(userId);
  }

 
  @Post('check-out')
  checkOut(@CurrentUser('user_id') userId: number) {
    return this.attendanceService.checkOut(userId);
  }

  
  @Get()
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.attendanceService.findAll(paginationDto);
  }

  
  @Get('employee/:id')
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  findByEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.attendanceService.findByEmployee(id, paginationDto);
  }
}