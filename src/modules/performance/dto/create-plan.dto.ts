import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsInt,
  IsDateString,
  Matches,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { CriterionDto } from './criterion.dto';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class CreatePlanDto {
  @ApiProperty({ example: 'تقييم الربع الرابع 2026' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  plan_name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Leave it out to cover every department.',
  })
  @IsOptional()
  @IsInt()
  department_id?: number;

  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  @Matches(DATE_ONLY, { message: 'period_start must be YYYY-MM-DD' })
  period_start!: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  @Matches(DATE_ONLY, { message: 'period_end must be YYYY-MM-DD' })
  period_end!: string;

  @ApiProperty({ example: '2027-01-01' })
  @IsDateString()
  @Matches(DATE_ONLY, { message: 'submission_start must be YYYY-MM-DD' })
  submission_start!: string;

  @ApiProperty({ example: '2027-01-10' })
  @IsDateString()
  @Matches(DATE_ONLY, { message: 'submission_end must be YYYY-MM-DD' })
  submission_end!: string;

  @ApiProperty({ type: [CriterionDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'A plan needs at least one criterion' })
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria!: CriterionDto[];
}