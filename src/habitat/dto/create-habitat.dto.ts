import { IsString, IsOptional } from 'class-validator';

export class CreateHabitatDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
