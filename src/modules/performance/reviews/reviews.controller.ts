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
import { ReviewsService } from './reviews.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '../../../common/enums/enums';

@ApiBearerAuth()
@Controller('performance/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('pending')
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  findPending(@CurrentUser() user: { user_id: number; role: Role }) {
    return this.reviewsService.findPendingFor(user);
  }

  @Get('me')
  findMine(@CurrentUser() user: { user_id: number }) {
    return this.reviewsService.findMine(user.user_id);
  }

  @Get('employee/:userId')
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  findForEmployee(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: { user_id: number; role: Role },
  ) {
    return this.reviewsService.findForEmployee(userId, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { user_id: number; role: Role },
  ) {
    return this.reviewsService.findOne(id, user);
  }

  @Put(':id/submit')
  @Roles(Role.MANAGER, Role.HR_ADMIN)
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitReviewDto,
    @CurrentUser() user: { user_id: number; role: Role },
  ) {
    return this.reviewsService.submit(id, dto, user);
  }
}