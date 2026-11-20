import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  HEALTH_SCORE_MAX,
  HEALTH_SCORE_MIN,
  PLANT_LOG_NOTES_MAX_LENGTH,
  trimString,
} from './create-plant-log.dto';
import {
  IsNotFutureDate,
  IsOptionalNotNull,
  ISO_DATETIME_MESSAGE,
  ISO_DATETIME_WITH_OFFSET,
} from './plant-log.validators';

/**
 * `type` and `details` cannot be changed. Fields can be replaced but not
 * cleared (null is rejected), so a log always keeps notes or healthScore.
 */
export class UpdatePlantLogDto {
  @ApiProperty({
    description: 'Free-text notes. Cannot be null.',
    example: 'Curling stopped after adjusting the light height.',
    maxLength: PLANT_LOG_NOTES_MAX_LENGTH,
    required: false,
  })
  @IsOptionalNotNull()
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(PLANT_LOG_NOTES_MAX_LENGTH)
  notes?: string;

  @ApiProperty({
    description: 'Overall health score from 1 to 5. Cannot be null.',
    example: 5,
    minimum: HEALTH_SCORE_MIN,
    maximum: HEALTH_SCORE_MAX,
    required: false,
  })
  @IsOptionalNotNull()
  @IsInt()
  @Min(HEALTH_SCORE_MIN)
  @Max(HEALTH_SCORE_MAX)
  healthScore?: number;

  @ApiProperty({
    description:
      'When it happened (ISO 8601 with offset). Must not be in the future.',
    example: '2026-11-19T14:30:00.000Z',
    required: false,
  })
  @IsOptionalNotNull()
  @IsISO8601({ strict: true })
  @Matches(ISO_DATETIME_WITH_OFFSET, { message: ISO_DATETIME_MESSAGE })
  @IsNotFutureDate()
  occurredAt?: string;
}
