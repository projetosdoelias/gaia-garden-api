export class ApiKeyListDto {
  id!: number;
  name!: string;
  isActive!: boolean;
  lastUsedAt!: Date | null;
  expiresAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
  habitatId!: number;
}
