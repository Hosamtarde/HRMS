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
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { promises as fsp } from 'fs';
import { UpdateApplicationStatusDto } from './dto/update-status.dto';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { RecruitmentService } from './recruitment.service';
import { ApplyDto } from './dto/apply.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

const PDF_SIGNATURE = '%PDF-';

@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Post('apply')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('cv_file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          callback(null, `${randomUUID()}.pdf`);
        },
      }),
      fileFilter: (req, file, callback) => {
        const isPdfMimetype = file.mimetype === 'application/pdf';
        const isPdfExtension = file.originalname.toLowerCase().endsWith('.pdf');

        if (!isPdfMimetype || !isPdfExtension) {
          return callback(
            new BadRequestException('Only PDF files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async apply(
    @Body() dto: ApplyDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('CV file is required');
    }

    await this.assertRealPdf(file.path);

    return this.recruitmentService.apply(dto, file.filename);
  }

  private async assertRealPdf(filePath: string): Promise<void> {
    const buffer = Buffer.alloc(PDF_SIGNATURE.length);
    const handle = await fsp.open(filePath, 'r');
    try {
      await handle.read(buffer, 0, PDF_SIGNATURE.length, 0);
    } finally {
      await handle.close();
    }

    if (buffer.toString('latin1') !== PDF_SIGNATURE) {
      await fsp.unlink(filePath).catch(() => undefined);
      throw new BadRequestException('The uploaded file is not a valid PDF');
    }
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