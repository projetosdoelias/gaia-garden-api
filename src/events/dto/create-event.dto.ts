import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    description: 'Descrição do evento',
    example: 'Adicionei fertilizante orgânico',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;
}