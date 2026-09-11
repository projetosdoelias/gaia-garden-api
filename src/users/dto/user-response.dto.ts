import { Exclude } from 'class-transformer';

export class UserResponseDto {
  id!: number;
  username!: string;
  confirmed!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  @Exclude()
  deletedAt!: Date | null;
}
