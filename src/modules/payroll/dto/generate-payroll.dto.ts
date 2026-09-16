import { IsDateString, IsOptional, IsInt, IsNumber, Min } from 'class-validator';

export class GeneratePayrollDto {
  @IsDateString()
  salary_month!: string;

  @IsOptional()
  @IsInt()
  user_id?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bonuses?: number;

 
}