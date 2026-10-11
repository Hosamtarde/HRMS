import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsOptional,
  IsString,
} from 'class-validator';
import { ScoreItemDto } from './score-item.dto';

export class SubmitReviewDto {
  @ApiPropertyOptional({ example: 'أداء ممتاز خلال الربع، مع ملاحظة على الالتزام بالمواعيد.' })
  @IsOptional()
  @IsString()
  reviewer_comment?: string;

  @ApiProperty({ type: [ScoreItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  scores!: ScoreItemDto[];
}