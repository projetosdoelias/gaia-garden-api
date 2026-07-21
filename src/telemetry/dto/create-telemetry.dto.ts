import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';
import { Matches } from 'class-validator';

export class CreateTelemetryDto {
  @ApiProperty({
    description: 'ID do habitat relacionado à telemetria',
    example: 1,
  })
  @IsNumber()
  habitatId!: number;

  @ApiProperty({
    description:
      'Data e hora da coleta da telemetria (formato: YYYY-MM-DD HH:MM:SS)',
    example: '2026-07-15 22:30:00',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, {
    message: 'recordedAt must be in format YYYY-MM-DD HH:MM:SS',
  })
  recordedAt?: Date;

  @ApiProperty({
    description: 'Temperatura medida em graus Celsius',
    example: 26.5,
    minimum: -50,
    maximum: 100,
  })
  @IsNumber()
  temperature!: number;

  @ApiProperty({
    description: 'Umidade relativa do ar em porcentagem',
    example: 65.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  humidity!: number;

  @ApiProperty({
    description: 'Déficit de pressão de vapor (VPD) em kPa',
    example: 1.2,
    minimum: 0,
  })
  @IsNumber()
  vpd!: number;
}
