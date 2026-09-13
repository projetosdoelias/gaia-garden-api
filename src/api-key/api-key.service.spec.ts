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
              findMany: jest.fn(),
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
    it('should create and return an API key with id, name and the plain apiKey', async () => {
      const mockCreateApiKeyDto = { name: 'test', habitatId: 1 };
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

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'test');
      expect(result).toHaveProperty('apiKey');
      expect(result.apiKey).toMatch(/^gg_live_/);
      expect(result.apiKey.length).toBeGreaterThan('gg_live_'.length);
      expect(prisma.apiKey.create).toHaveBeenCalled();
    });

    it('should store the hashed key, not the plain key', async () => {
      const mockCreateApiKeyDto = { name: 'test', habitatId: 1 };

      jest.spyOn(prisma.apiKey, 'create').mockResolvedValue({
        id: 1,
        name: 'test',
        keyHash: 'hashed_key',
        isActive: true,
        lastUsedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        habitatId: 1,
      });

      const result = await service.createApiKey(mockCreateApiKeyDto);

      const createCallArgs = (prisma.apiKey.create as jest.Mock).mock.calls[0][0];
      expect(createCallArgs.data.keyHash).not.toBe(result.apiKey);
      expect(createCallArgs.data.keyHash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('deactivateApiKey', () => {
    it('should deactivate an API key by setting isActive to false', async () => {
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
    it('should validate and return habitatId if API key is active', async () => {
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

      expect(result).toEqual({ habitatId: 1 });
      expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
        where: {
          keyHash: expect.any(String),
          isActive: true,
        },
      });
      const findFirstArgs = (prisma.apiKey.findFirst as jest.Mock).mock
        .calls[0][0];
      expect(findFirstArgs.where.keyHash).toMatch(/^[a-f0-9]{64}$/);
      expect(prisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should return null if API key is inactive', async () => {
      jest.spyOn(prisma.apiKey, 'findFirst').mockResolvedValue(null);

      const result = await service.validateApiKey('invalid_key');

      expect(result).toBeNull();
      expect(prisma.apiKey.update).not.toHaveBeenCalled();
    });

    it('should return null when no API key matches the hash', async () => {
      jest.spyOn(prisma.apiKey, 'findFirst').mockResolvedValue(null);

      const result = await service.validateApiKey('nonexistent_key');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all API keys formatted correctly', async () => {
      const mockApiKeys = [
        {
          id: 1,
          name: 'key1',
          isActive: true,
          lastUsedAt: new Date('2026-06-15T12:00:00.000Z'),
          expiresAt: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-06-15T12:00:00.000Z'),
          habitatId: 1,
        },
        {
          id: 2,
          name: 'key2',
          isActive: false,
          lastUsedAt: null,
          expiresAt: null,
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
          updatedAt: new Date('2026-06-10T00:00:00.000Z'),
          habitatId: 2,
        },
      ];

      jest
        .spyOn(prisma.apiKey, 'findMany')
        .mockResolvedValue(mockApiKeys as any);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'key1',
        isActive: true,
        lastUsedAt: mockApiKeys[0].lastUsedAt,
        expiresAt: null,
        createdAt: mockApiKeys[0].createdAt,
        updatedAt: mockApiKeys[0].updatedAt,
        habitatId: 1,
      });
      expect(result[1]).toEqual({
        id: 2,
        name: 'key2',
        isActive: false,
        lastUsedAt: null,
        expiresAt: null,
        createdAt: mockApiKeys[1].createdAt,
        updatedAt: mockApiKeys[1].updatedAt,
        habitatId: 2,
      });
      expect(prisma.apiKey.findMany).toHaveBeenCalled();
    });

    it('should return an empty array when no API keys exist', async () => {
      jest.spyOn(prisma.apiKey, 'findMany').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
