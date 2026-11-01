import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/enums';
import { OrgChartService } from './org-chart.service';
import { ChangeManagerDto } from './dto/change-manager.dto';

interface JwtUser {
  user_id: number;
  email: string;
  role: Role;
}

@ApiBearerAuth()
@Controller('org-chart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_ADMIN, Role.MANAGER, Role.EMPLOYEE)
export class OrgChartController {
  constructor(private readonly orgChartService: OrgChartService) {}

  @Get()
  getChart() {
    return this.orgChartService.getChart();
  }

  @Get('me')
  getMyCircle(@CurrentUser() user: JwtUser) {
    return this.orgChartService.getCircle(user.user_id);
  }

  @Get(':userId')
  getBranch(@Param('userId', ParseIntPipe) userId: number) {
    return this.orgChartService.getChart(userId);
  }

  @Put(':userId/manager')
  @Roles(Role.HR_ADMIN)
  changeManager(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: ChangeManagerDto,
  ) {
    return this.orgChartService.changeManager(userId, dto.managerId);
  }
}