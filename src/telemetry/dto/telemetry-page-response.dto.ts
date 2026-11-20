import { ApiProperty } from '@nestjs/swagger';
import { TelemetryLastResponseDto } from './telemetry-last-response.dto';

export class TelemetryPageResponseDto {
  @ApiProperty({
    type: [TelemetryLastResponseDto],
    description: 'Readings ordered by recordedAt desc, then id desc',
  })
  data!: TelemetryLastResponseDto[];

  @ApiProperty({
    type: String,
    nullable: true,
    description:
      'Pass as `cursor` to fetch the next page; null on the last page',
    example: 'eyJyIjoiMjAyNi0xMS0xOVQxMjowMDowMC4wMDBaIiwiaSI6NDJ9',
  })
  nextCursor!: string | null;
}
