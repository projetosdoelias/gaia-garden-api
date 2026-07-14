import { IsString, IsOptional } from 'class-validator';

export class UpdateHabitatDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
