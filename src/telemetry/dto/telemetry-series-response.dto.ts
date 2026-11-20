import { ApiProperty } from '@nestjs/swagger';
import { TelemetryBucket, TelemetryMetric } from './telemetry-series-query.dto';

export class TelemetrySeriesPointDto {
  @ApiProperty({
    description: 'Bucket start as a UTC ISO 8601 instant',
    example: '2026-11-01T03:00:00.000Z',
  })
  bucketStart!: string;

  @ApiProperty({ description: 'Average value in the bucket', example: 1.18 })
  avg!: number;

  @ApiProperty({ description: 'Minimum value in the bucket', example: 0.95 })
  min!: number;

  @ApiProperty({ description: 'Maximum value in the bucket', example: 1.42 })
  max!: number;

  @ApiProperty({ description: 'Number of readings in the bucket', example: 12 })
  count!: number;
}

export class TelemetrySeriesResponseDto {
  @ApiProperty({ example: 1 })
  habitatId!: number;

  @ApiProperty({ enum: TelemetryMetric, example: TelemetryMetric.VPD })
  metric!: TelemetryMetric;

  @ApiProperty({ enum: TelemetryBucket, example: TelemetryBucket.HOUR })
  bucket!: TelemetryBucket;

  @ApiProperty({ example: '2026-11-01T03:00:00.000Z' })
  from!: string;

  @ApiProperty({ example: '2026-11-02T03:00:00.000Z' })
  to!: string;

  @ApiProperty({ example: 'America/Sao_Paulo' })
  tz!: string;

  @ApiProperty({
    type: [TelemetrySeriesPointDto],
    description:
      'Points sorted by bucketStart ascending. Empty buckets are omitted.',
  })
  points!: TelemetrySeriesPointDto[];
}
