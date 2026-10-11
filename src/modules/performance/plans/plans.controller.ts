import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/enums';

@ApiBearerAuth()
@Controller('performance/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get(':id')
  @Roles(Role.HR_ADMIN, Role.MANAGER)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.findOne(id);
  }

  @Post()
  @Roles(Role.HR_ADMIN)
  create(
    @Body() dto: CreatePlanDto,
    @CurrentUser() user: { user_id: number },
  ) {
    return this.plansService.create(dto, user.user_id);
  }

  @Patch(':id/activate')
  @Roles(Role.HR_ADMIN)
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.activate(id);
  }

  @Patch(':id/close')
  @Roles(Role.HR_ADMIN)
  close(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.close(id);
  }
}