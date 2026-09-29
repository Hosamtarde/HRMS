import {
  Body,
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Post,
  Put,
  Delete,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateApplicationStatusDto } from './dto/update-status.dto';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { RecruitmentService } from './recruitment.service';
import { ApplyDto } from './dto/apply.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, RecruitmentStatus } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Post('apply')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('cv_file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueName = `${Date.now()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
    fileFilter: (req, file, callback) => {
    const isPdfMimetype = file.mimetype === 'application/pdf';
    const isPdfExtension = file.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdfMimetype && !isPdfExtension) {
        return callback(new BadRequestException('Only PDF files are allowed'), false);
    }
    callback(null, true);
    },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  apply(@Body() dto: ApplyDto, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('CV file is required');
    }
    return this.recruitmentService.apply(dto, file.filename);
  }

  @ApiBearerAuth()
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR_ADMIN)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.recruitmentService.findAll(paginationDto);
  }

  @ApiBearerAuth()
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR_ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recruitmentService.findOne(id);
  }

  @ApiBearerAuth()
  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR_ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.recruitmentService.updateStatus(id, dto.status);
  }

  @ApiBearerAuth()
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HR_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recruitmentService.remove(id);
  }
}