import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, Matches } from 'class-validator';
import {
  ISO_DATETIME_MESSAGE,
  ISO_DATETIME_WITH_OFFSET,
} from './plant-log.validators';
import { PlantLogType } from '../plant-log-types';

export class PlantLogQueryDto {
  @ApiProperty({
    description: 'Only logs that occurred at or after this ISO 8601 datetime',
    example: '2026-11-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(ISO_DATETIME_WITH_OFFSET, { message: ISO_DATETIME_MESSAGE })
  from?: string;

  @ApiProperty({
    description: 'Only logs that occurred before this ISO 8601 datetime',
    example: '2026-12-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(ISO_DATETIME_WITH_OFFSET, { message: ISO_DATETIME_MESSAGE })
  to?: string;

  @ApiProperty({
    description: 'Only logs of this type',
    enum: PlantLogType,
    required: false,
  })
  @IsOptional()
  @IsEnum(PlantLogType)
  type?: PlantLogType;
}
