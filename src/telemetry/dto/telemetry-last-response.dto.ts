import { ApiProperty } from '@nestjs/swagger';

export class TelemetryLastResponseDto {
  @ApiProperty({
    description: 'ID do registro de telemetria',
    example: 42,
  })
  id!: number;

  @ApiProperty({
    description: 'ID do habitat relacionado',
    example: 1,
  })
  habitatId!: number;

  @ApiProperty({
    description: 'Data e hora da coleta da telemetria',
    example: '2026-07-15T22:30:00.000Z',
  })
  recordedAt!: Date;

  @ApiProperty({
    description: 'Data e hora de criação do registro',
    example: '2026-07-15T22:30:01.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Temperatura medida em graus Celsius',
    example: 26.5,
  })
  temperature!: number;

  @ApiProperty({
    description: 'Umidade relativa do ar em porcentagem',
    example: 65.5,
  })
  humidity!: number;

  @ApiProperty({
    description: 'Déficit de pressão de vapor (VPD) em kPa',
    example: 1.2,
  })
  vpd!: number;
}
