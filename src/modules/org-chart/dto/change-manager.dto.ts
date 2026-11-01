import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, ValidateIf } from 'class-validator';

export class ChangeManagerDto {
  @ApiProperty({
    example: 5,
    nullable: true,
    description: 'User id of the new manager, or null to detach',
  })
  @ValidateIf((o) => o.managerId !== null)
  @IsInt()
  @IsPositive()
  managerId!: number | null;
}