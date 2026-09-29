import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Ahmad' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  first_name?: string;

  @ApiPropertyOptional({ example: 'Khalil' })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  last_name?: string;

  @ApiPropertyOptional({ example: '0599123456' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+\-\s]{7,20}$/, {
    message: 'phone_number must be a valid phone number',
  })
  phone_number?: string;

  @ApiPropertyOptional({ example: 'profile_42.png' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  profile_image?: string;
}