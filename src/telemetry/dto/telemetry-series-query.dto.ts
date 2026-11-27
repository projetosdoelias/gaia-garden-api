import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

export enum TelemetryBucket {
  HOUR = 'hour',
  DAY = 'day',
}

/** Metrics that can be aggregated. Add temperature/humidity here later. */
export enum TelemetryMetric {
  VPD = 'vpd',
}

/** Named zones only ("UTC", "America/Sao_Paulo"); no "+01:00" / "UTC+3". */
const IANA_ZONE_NAME = /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/;

/**
 * Accepts IANA zone names known to ICU, including aliases such as
 * "Asia/Kolkata" / "Asia/Calcutta". Offsets such as "+01:00" are rejected on
 * purpose: PostgreSQL interprets POSIX-style offsets with an inverted sign.
 */
export function isIanaTimeZone(value: unknown): boolean {
  if (typeof value !== 'string' || !IANA_ZONE_NAME.test(value)) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Calendar date-time with an explicit offset ("Z" or "±HH:MM"). Rejects ISO
 * week/ordinal dates (which `new Date()` cannot parse) and offset-less values
 * (which would be read in the server's local time zone).
 */
export const ISO_DATETIME_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
export const ISO_DATETIME_MESSAGE =
  '$property must be an ISO 8601 date-time with offset, e.g. 2026-11-01T00:00:00Z';

export function IsIanaTimeZone(options?: ValidationOptions): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isIanaTimeZone',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: {
        message: '$property must be a valid IANA time zone (e.g. "UTC")',
        ...options,
      },
      validator: { validate: isIanaTimeZone },
    });
  };
}

export class TelemetrySeriesQueryDto {
  @ApiProperty({
    description: 'Range start (inclusive), ISO 8601 datetime',
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsISO8601({ strict: true })
  @Matches(ISO_DATETIME_WITH_OFFSET, { message: ISO_DATETIME_MESSAGE })
  from!: string;

  @ApiProperty({
    description:
      'Range end (exclusive), ISO 8601 datetime. Must be after `from`; max range is 90 days.',
    example: '2026-11-02T00:00:00.000Z',
  })
  @IsISO8601({ strict: true })
  @Matches(ISO_DATETIME_WITH_OFFSET, { message: ISO_DATETIME_MESSAGE })
  to!: string;

  @ApiProperty({
    description:
      'Bucket size. When omitted: `hour` if the range is <= 48h, otherwise `day`.',
    enum: TelemetryBucket,
    required: false,
    example: TelemetryBucket.HOUR,
  })
  @IsOptional()
  @IsEnum(TelemetryBucket)
  bucket?: TelemetryBucket;

  @ApiProperty({
    description: 'Metric to aggregate',
    enum: TelemetryMetric,
    required: false,
    default: TelemetryMetric.VPD,
  })
  @IsOptional()
  @IsEnum(TelemetryMetric)
  metric: TelemetryMetric = TelemetryMetric.VPD;

  @ApiProperty({
    description:
      'IANA time zone used to compute bucket boundaries. During the DST fall-back hour, two UTC hours share one local hourly bucket.',
    required: false,
    default: 'UTC',
    example: 'America/Sao_Paulo',
  })
  @IsOptional()
  @IsString()
  @IsIanaTimeZone()
  tz: string = 'UTC';
}
