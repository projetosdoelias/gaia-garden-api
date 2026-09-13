import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiKeyService } from '../api-key/api-key.service';

describe('TelemetryController', () => {
  let controller: TelemetryController;
  let service: TelemetryService;

  const mockRequest = (overrides?: Partial<Record<string, any>>) =>
    ({
      apiKeyId: undefined,
      ...overrides,
    }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelemetryController],
      providers: [
        {
          provide: TelemetryService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findLastByHabitatId: jest.fn(),
          },
        },
        {
          provide: ApiKeyService,
          useValue: {
            validateApiKey: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        JwtGuard,
      ],
    }).compile();

    controller = module.get<TelemetryController>(TelemetryController);
    service = module.get<TelemetryService>(TelemetryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a telemetry record using habitatId from DTO when request has no apiKeyId', async () => {
      const createTelemetryDto = {
        habitatId: 1,
        temperature: 25,
        humidity: 60,
      };
      const req = mockRequest();
      const expectedRecord = { id: 1, ...createTelemetryDto, vpd: 1.27 };

      jest.spyOn(service, 'create').mockResolvedValue(expectedRecord as any);

      const result = await controller.create(createTelemetryDto, req);

      expect(result).toEqual(expectedRecord);
      expect(service.create).toHaveBeenCalledWith({
        ...createTelemetryDto,
        habitatId: 1,
      });
    });

    it('should use habitatId from request apiKeyId when present (API Key auth)', async () => {
      const createTelemetryDto = {
        temperature: 25,
        humidity: 60,
      };
      const req = mockRequest({ apiKeyId: 5 });
      const expectedRecord = { id: 1, ...createTelemetryDto, habitatId: 5, vpd: 1.27 };

      jest.spyOn(service, 'create').mockResolvedValue(expectedRecord as any);

      const result = await controller.create(createTelemetryDto, req);

      expect(result).toEqual(expectedRecord);
      expect(service.create).toHaveBeenCalledWith({
        ...createTelemetryDto,
        habitatId: 5,
      });
    });

    it('should throw BadRequestException when both request and DTO have no habitatId', async () => {
      const createTelemetryDto = {
        temperature: 25,
        humidity: 60,
      };
      const req = mockRequest({ apiKeyId: undefined });

      expect(() =>
        controller.create(createTelemetryDto, req),
      ).toThrow('habitatId is required');
    });
  });

  describe('findAll', () => {
    it('should return all telemetry records', async () => {
      const mockRecords = [
        { id: 1, temperature: 25 },
        { id: 2, temperature: 26 },
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockRecords as any);

      const result = await controller.findAll();

      expect(result).toEqual(mockRecords);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a telemetry record by id (string converted to number)', async () => {
      const mockRecord = { id: 1, temperature: 25 };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockRecord as any);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockRecord);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('findLast', () => {
    it('should return the latest telemetry record for a given habitat', async () => {
      const mockRecord = {
        id: 3,
        habitatId: 1,
        temperature: 25,
        humidity: 60,
        createdAt: new Date('2026-06-15T12:00:00.000Z'),
      };
      jest
        .spyOn(service, 'findLastByHabitatId')
        .mockResolvedValue(mockRecord as any);

      const result = await controller.findLast('1');

      expect(result).toEqual(mockRecord);
      expect(service.findLastByHabitatId).toHaveBeenCalledWith(1);
    });

    it('should throw BadRequestException when id is not a valid number', async () => {
      await expect(controller.findLast('abc')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when no telemetry found', async () => {
      jest.spyOn(service, 'findLastByHabitatId').mockResolvedValue(null);

      await expect(controller.findLast('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
