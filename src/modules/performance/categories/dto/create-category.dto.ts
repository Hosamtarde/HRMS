import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'جودة العمل' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category_name!: string;

  @ApiPropertyOptional({ example: 'دقة واكتمال المهام المسلَّمة' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}