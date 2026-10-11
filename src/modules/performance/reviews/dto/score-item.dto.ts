import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ScoreItemDto {
  @ApiProperty({ example: 7, description: 'A criterion belonging to this plan.' })
  @IsInt()
  criteria_id!: number;

  @ApiProperty({ example: 4, description: 'Between 1 and the criterion max_score.' })
  @IsInt()
  @Min(1)
  score!: number;

  @ApiPropertyOptional({ example: 'سلّم كل المهام في وقتها' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}