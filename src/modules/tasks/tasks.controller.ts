import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, TaskStatus } from '../../common/enums/enums';

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
  findAll(@CurrentUser() user: JwtUser) {
    return this.tasksService.findAll(user.user_id, user.role);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Put(':id/status')
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: TaskStatus) {
    return this.tasksService.updateStatus(id, status);
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
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }
}