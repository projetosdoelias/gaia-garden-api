import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    description: 'Event description',
    example: 'I added organic fertilizer',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;
}
