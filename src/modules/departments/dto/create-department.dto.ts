import { IsNotEmpty, IsOptional, IsInt, IsString, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Department name is required' })
  @MaxLength(100)
  department_name!: string;

  @IsOptional()
  @IsInt({ message: 'manager_id must be a valid user id' })
  manager_id?: number;
}