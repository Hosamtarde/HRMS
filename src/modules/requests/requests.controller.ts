import { Body, Controller, Get, Param,Query, ParseIntPipe, Post,Delete, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { ReviewRequestDto } from './dto/review-request.dto';
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
@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateRequestDto) {
    return this.requestsService.create(user.user_id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.requestsService.findAll(user.user_id, user.role, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.requestsService.findOne(id, user.user_id, user.role);
  }

  @Put(':id/review')
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewRequestDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.requestsService.review(id, dto, user.user_id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.requestsService.remove(id, user.user_id, user.role);
  }

}