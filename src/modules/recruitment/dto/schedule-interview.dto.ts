import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class ScheduleInterviewDto {
  @ApiProperty({
    example: '2026-11-20T09:30:00.000Z',
    description: 'Interview date and time as an ISO 8601 string with an offset',
  })
  @IsDateString()
  interview_at!: string;
}
