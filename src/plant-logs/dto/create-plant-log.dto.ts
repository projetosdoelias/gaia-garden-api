import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDefined,
  IsEnum,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ENABLED_PLANT_LOG_TYPES, PlantLogType } from '../plant-log-types';
import {
  IsDetailsValidForType,
  IsNotFutureDate,
  IsOptionalNotNull,
  ISO_DATETIME_MESSAGE,
  ISO_DATETIME_WITH_OFFSET,
} from './plant-log.validators';

export const PLANT_LOG_NOTES_MAX_LENGTH = 2000;
export const HEALTH_SCORE_MIN = 1;
export const HEALTH_SCORE_MAX = 5;

export const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePlantLogDto {
  @ApiProperty({
    description: `Log type. Currently accepted: ${ENABLED_PLANT_LOG_TYPES.join(', ')}. Other values of the enum are reserved for future use and rejected with 400.`,
    enum: ENABLED_PLANT_LOG_TYPES,
    example: PlantLogType.OBSERVATION,
  })
  @IsEnum(PlantLogType)
  @IsIn(ENABLED_PLANT_LOG_TYPES, {
    message: `type $value is not supported yet; accepted types: ${ENABLED_PLANT_LOG_TYPES.join(', ')}`,
  })
  type!: PlantLogType;

  @ApiProperty({
    description:
      'Free-text notes. At least one of notes or healthScore is required.',
    example: 'New leaves look healthy; slight curling on the lower ones.',
    maxLength: PLANT_LOG_NOTES_MAX_LENGTH,
    required: false,
  })
  @ValidateIf(
    (o: CreatePlantLogDto) =>
      o.notes !== undefined || o.healthScore === undefined,
  )
  @IsDefined({ message: 'at least one of notes or healthScore is required' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(PLANT_LOG_NOTES_MAX_LENGTH)
  notes?: string;

  @ApiProperty({
    description:
      'Overall health score from 1 (poor) to 5 (excellent). At least one of notes or healthScore is required.',
    example: 4,
    minimum: HEALTH_SCORE_MIN,
    maximum: HEALTH_SCORE_MAX,
    required: false,
  })
  @IsOptionalNotNull()
  @IsInt()
  @Min(HEALTH_SCORE_MIN)
  @Max(HEALTH_SCORE_MAX)
  healthScore?: number;

  @ApiPropertyOptional({
    description:
      'Type-specific payload, validated per type. Not accepted for OBSERVATION.',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptionalNotNull()
  @IsDetailsValidForType()
  details?: Record<string, unknown>;

  @ApiProperty({
    description:
      'When it happened (ISO 8601 with offset). Defaults to now. Must not be in the future.',
    example: '2026-11-19T14:30:00.000Z',
    required: false,
  })
  @IsOptionalNotNull()
  @IsISO8601({ strict: true })
  @Matches(ISO_DATETIME_WITH_OFFSET, { message: ISO_DATETIME_MESSAGE })
  @IsNotFutureDate()
  occurredAt?: string;
}
