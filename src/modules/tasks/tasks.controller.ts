import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateCompletionDto } from './dto/update-completion.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

interface JwtUser {
  user_id: number;
  email: string;
  role: Role;
}

@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.user_id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.tasksService.findAll(user.user_id, user.role, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.tasksService.findOne(id, user.user_id, user.role);
  }

  @Put(':id')
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.tasksService.update(id, dto, user.user_id, user.role);
  }

  @Put(':id/status')
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.tasksService.updateStatus(id, dto.status, user.user_id, user.role);
  }

  @Put(':id/completion')
  updateCompletion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCompletionDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.tasksService.updateCompletion(id, user.user_id, dto.completion_percentage);
  }

  @Delete(':id')
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.tasksService.remove(id, user.user_id, user.role);
  }
}