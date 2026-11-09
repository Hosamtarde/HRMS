import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { Role } from '../../../common/enums/enums';

export class UpdateRoleDto {
  @ApiProperty({ enum: Role, example: Role.MANAGER })
  @IsEnum(Role)
  role!: Role;
}
