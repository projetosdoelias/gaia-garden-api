import { IsString, IsInt } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  name!: string;

  @IsInt()
  habitatId!: number;
}
