import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RecruitmentStatus } from '../../../common/enums/enums';

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: RecruitmentStatus })
  @IsEnum(RecruitmentStatus)
  status!: RecruitmentStatus;
}