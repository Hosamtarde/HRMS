import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { EmploymentType } from '../../../common/enums/enums';

export class CreateEmployeeDto {
    
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  first_name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  last_name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsInt()
  department_id?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  position!: string;

  @IsDateString()
  hire_date!: string;

  @IsNumber()
  @Min(0)
  basic_salary!: number;

  @IsEnum(EmploymentType)
  employment_type!: EmploymentType;
}