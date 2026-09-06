import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '../../../common/enums/enums';

export class ReviewRequestDto {
  @IsEnum(RequestStatus)
  status!: RequestStatus;

  @IsOptional()
  @IsString()
  review_notes?: string; 
}