import { IsInt, Min, Max } from 'class-validator';

export class UpdateCompletionDto {
  @IsInt()
  @Min(0)
  @Max(100)
  completion_percentage!: number;
}