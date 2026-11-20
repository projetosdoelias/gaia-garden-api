import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ISO_DATETIME_MESSAGE,
  ISO_DATETIME_WITH_OFFSET,
} from './telemetry-series-query.dto';

export const TELEMETRY_LIST_DEFAULT_LIMIT = 50;
export const TELEMETRY_LIST_MAX_LIMIT = 200;

export class TelemetryListQueryDto {
  @ApiProperty({
    description: 'Page size',
    required: false,
    default: TELEMETRY_LIST_DEFAULT_LIMIT,
    minimum: 1,
    maximum: TELEMETRY_LIST_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(TELEMETRY_LIST_MAX_LIMIT)
  limit: number = TELEMETRY_LIST_DEFAULT_LIMIT;

  @ApiProperty({
    description: 'Opaque cursor returned as `nextCursor` by the previous page',
    required: false,
    example: 'eyJyIjoiMjAyNi0xMS0xOVQxMjowMDowMC4wMDBaIiwiaSI6NDJ9',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  cursor?: string;

  @ApiProperty({
    description: 'Only readings recorded at or after this ISO 8601 datetime',
    required: false,
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(ISO_DATETIME_WITH_OFFSET, { message: ISO_DATETIME_MESSAGE })
  from?: string;

  @ApiProperty({
    description: 'Only readings recorded before this ISO 8601 datetime',
    required: false,
    example: '2026-11-02T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  @Matches(ISO_DATETIME_WITH_OFFSET, { message: ISO_DATETIME_MESSAGE })
  to?: string;
}
