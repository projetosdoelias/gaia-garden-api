import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDate } from 'class-validator';

export class CreateTelemetryDto {
  @ApiProperty({
    description: 'ID do habitat relacionado à telemetria',
    example: 1,
  })
  @IsNumber()
  habitatId!: number;

  @ApiProperty({
    description: 'Data e hora da coleta da telemetria',
    example: '2026-07-15T22:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  recordedAt!: Date;

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
