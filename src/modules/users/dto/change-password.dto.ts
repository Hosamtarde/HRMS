import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsString()
  current_password!: string;

  @ApiProperty({ example: 'newPassword456', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'new_password must be at least 8 characters' })
  new_password!: string;
}