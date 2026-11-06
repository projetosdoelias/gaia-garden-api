import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlantDto {
  @ApiProperty({
    description: 'Nome da planta',
    example: 'Tomate Cereja',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Descrição da planta',
    example: 'Planta de tomate cereja em crescimento',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Cepa ou variedade da planta',
    example: 'Sakura',
    required: false,
  })
  @IsString()
  @IsOptional()
  strain?: string;

  @ApiProperty({
    description: 'Data da germinação',
    example: '2026-07-15T22:30:00.000Z',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  germinatedAt?: string;

  @ApiProperty({
    description: 'Data da fase de muda (seedling)',
    example: '2026-07-22T22:30:00.000Z',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  seedlingAt?: string;

  @ApiProperty({
    description: 'Data da fase vegetativa',
    example: '2026-08-05T22:30:00.000Z',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  vegetativeAt?: string;

  @ApiProperty({
    description: 'Data da fase de floração',
    example: '2026-09-01T22:30:00.000Z',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  floweringAt?: string;
}