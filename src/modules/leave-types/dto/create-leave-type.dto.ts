import { ApiProperty,ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString,IsBoolean,IsOptional, Length, Max, Min } from 'class-validator';
import { PaymentType } from '../../../common/enums/enums';

export class CreateLeaveTypeDto {
  @ApiProperty({ example: 'إجازة أمومة' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  type_name!: string;

  @ApiProperty({ enum: PaymentType, example: PaymentType.PAID })
  @IsEnum(PaymentType)
  payment_type!: PaymentType;

  @ApiProperty({ example: 70 })
  @IsInt()
  @Min(0)
  @Max(365)
  default_days!: number;

  @ApiPropertyOptional({ example: true, description: 'Entitlement grows with years of service, and unused days carry over' })
  @IsOptional()
  @IsBoolean()
  uses_service_tiers?: boolean;

}