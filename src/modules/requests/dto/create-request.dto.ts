import {
  IsEnum,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsInt,
  Min,
  ValidateIf,
} from 'class-validator';
import { RequestType, LeaveType } from '../../../common/enums/enums';

export class CreateRequestDto {
  @IsEnum(RequestType)
  request_type!: RequestType;

  
  @ValidateIf((o) => o.request_type === RequestType.LEAVE)
  @IsEnum(LeaveType)
  leave_type?: LeaveType;

  @ValidateIf((o) => o.request_type === RequestType.LEAVE)
  @IsDateString()
  start_date?: string;

  @ValidateIf((o) => o.request_type === RequestType.LEAVE)
  @IsDateString()
  end_date?: string;

  
  @ValidateIf((o) => o.request_type === RequestType.LOAN)
  @IsNumber()
  @Min(1)
  loan_amount?: number;

  @ValidateIf((o) => o.request_type === RequestType.LOAN)
  @IsInt()
  @Min(1)
  repayment_period?: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  @IsString()
  attachment?: string;
}