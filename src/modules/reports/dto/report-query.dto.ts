import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Validate } from 'class-validator';
import { ReportFormat } from '../../../common/enums/enums';
import { IsNotBeforeConstraint } from '../../../common/validators/date-range.validator';

export class ReportQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  @Validate(IsNotBeforeConstraint, ['from'])
  to!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;
}