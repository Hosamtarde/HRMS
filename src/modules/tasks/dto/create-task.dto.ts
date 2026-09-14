import { IsString, IsNotEmpty, MaxLength, IsDateString, IsEnum, IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { TaskPriority } from '../../../common/enums/enums';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  task_title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDateString()
  deadline!: string;

  @IsEnum(TaskPriority)
  task_priority!: TaskPriority;

  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  assigned_user_ids!: number[];
}