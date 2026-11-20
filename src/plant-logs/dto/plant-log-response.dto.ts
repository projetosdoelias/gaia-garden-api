import { ApiProperty } from '@nestjs/swagger';
import { PlantLogType } from '../plant-log-types';

export class PlantLogResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 3 })
  plantId!: number;

  @ApiProperty({ enum: PlantLogType, example: PlantLogType.OBSERVATION })
  type!: PlantLogType;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'New leaves look healthy.',
  })
  notes!: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  healthScore!: number | null;

  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    nullable: true,
    example: null,
  })
  details!: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-11-19T14:30:00.000Z' })
  occurredAt!: Date;

  @ApiProperty({ example: '2026-11-19T14:31:02.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-11-19T14:31:02.000Z' })
  updatedAt!: Date;

  @ApiProperty({ type: Date, nullable: true, example: null })
  deletedAt!: Date | null;
}

export class PlantLogDeletedResponseDto {
  @ApiProperty({ example: true })
  deleted!: boolean;
}
