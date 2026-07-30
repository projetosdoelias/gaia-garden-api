import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { ApiKeyListDto } from './dto/api-key-list.dto';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private generateApiKey(): string {
    const prefix = 'gg_live_';
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `${prefix}${randomBytes}`;
  }

  private hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  async createApiKey(
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeyResponseDto> {
    const apiKey = this.generateApiKey();
    const keyHash = this.hashApiKey(apiKey);

    const apiKeyRecord = await this.prisma.apiKey.create({
      data: {
        name: createApiKeyDto.name,
        keyHash,
        habitatId: createApiKeyDto.habitatId,
      },
    });

    return {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      apiKey,
    };
  }

  async deactivateApiKey(id: number): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async validateApiKey(apiKey: string): Promise<{ habitatId: number } | null> {
    const keyHash = this.hashApiKey(apiKey);
    const apiKeyRecord = await this.prisma.apiKey.findFirst({
      where: {
        keyHash,
        isActive: true,
      },
    });

    if (!apiKeyRecord) {
      return null;
    }

    await this.prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    return { habitatId: apiKeyRecord.habitatId };
  }

  async findAll(): Promise<ApiKeyListDto[]> {
    const apiKeys = await this.prisma.apiKey.findMany();
    return apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
      habitatId: key.habitatId,
    }));
  }
}
