import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyService } from './api-key.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        {
          provide: PrismaService,
          useValue: {
            apiKey: {
              create: jest.fn(),
              update: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ApiKeyService>(ApiKeyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createApiKey', () => {
    it('should create and return an API key', async () => {
      const mockCreateApiKeyDto = { name: 'test', habitatId: 1 };
      const mockApiKey = 'gg_live_test123';
      const mockApiKeyRecord = {
        id: 1,
        name: 'test',
        keyHash: 'hashed_key',
        isActive: true,
        lastUsedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        habitatId: 1,
      };

      jest.spyOn(prisma.apiKey, 'create').mockResolvedValue(mockApiKeyRecord);

      const result = await service.createApiKey(mockCreateApiKeyDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('apiKey');
      expect(prisma.apiKey.create).toHaveBeenCalled();
    });
  });

  describe('deactivateApiKey', () => {
    it('should deactivate an API key', async () => {
      const mockId = 1;

      jest.spyOn(prisma.apiKey, 'update').mockResolvedValue({} as any);

      await service.deactivateApiKey(mockId);

      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: mockId },
        data: { isActive: false },
      });
    });
  });

  describe('validateApiKey', () => {
    it('should validate and return habitatId if valid', async () => {
      const mockApiKey = 'gg_live_test123';
      const mockApiKeyRecord = {
        id: 1,
        name: 'test',
        keyHash: 'hashed_key',
        isActive: true,
        lastUsedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        habitatId: 1,
      };

      jest
        .spyOn(prisma.apiKey, 'findFirst')
        .mockResolvedValue(mockApiKeyRecord);
      jest.spyOn(prisma.apiKey, 'update').mockResolvedValue({} as any);

      const result = await service.validateApiKey(mockApiKey);

      expect(result).toEqual({ habitatId: mockApiKeyRecord.habitatId });
      expect(prisma.apiKey.findFirst).toHaveBeenCalled();
      expect(prisma.apiKey.update).toHaveBeenCalled();
    });

    it('should return null if API key is invalid', async () => {
      jest.spyOn(prisma.apiKey, 'findFirst').mockResolvedValue(null);

      const result = await service.validateApiKey('invalid_key');

      expect(result).toBeNull();
    });
  });
});
