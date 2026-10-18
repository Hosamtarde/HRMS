import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsEnum,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { NotificationType } from '../../../common/enums/enums';

export class CreateNotificationDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  user_id!: number;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ example: 'تمت الموافقة على طلب الإجازة' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiProperty({ example: 'وافق خالد منصور على إجازتك من 5 إلى 8 أكتوبر.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message!: string;

  @ApiPropertyOptional({ example: '/requests/12' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  link?: string;
}