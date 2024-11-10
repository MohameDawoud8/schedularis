import { IsString, IsInt, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['email', 'processing'] })
  @IsEnum(['email', 'processing'])
  type: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  cronSchedule?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  priority?: number;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
