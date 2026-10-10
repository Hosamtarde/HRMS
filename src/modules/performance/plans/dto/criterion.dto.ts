import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { DEFAULT_MAX_SCORE, TOTAL_WEIGHT } from '../../performance.constants';

export class CriterionDto {
  @ApiProperty({ example: 1, description: 'An active criteria category.' })
  @IsInt()
  category_id!: number;

  @ApiProperty({ example: 'دقة واكتمال المهام المسلَّمة' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  criteria_text!: string;

  @ApiProperty({ example: 40, description: 'Percent. All weights must total 100.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(TOTAL_WEIGHT)
  weight!: number;

  @ApiPropertyOptional({ example: 5, default: DEFAULT_MAX_SCORE })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  max_score?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;
}