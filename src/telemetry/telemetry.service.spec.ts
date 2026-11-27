import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelemetryService,
        {
          provide: PrismaService,
          useValue: {
            habitat: {
              findFirst: jest.fn(),
            },
            telemetry: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const validDto = {
      habitatId: 1,
      temperature: 25,
      humidity: 60,
    };

    it('should create a telemetry record and calculate VPD automatically', async () => {
      const createdRecord = {
        id: 1,
        habitatId: 1,
        temperature: 25,
        humidity: 60,
        vpd: 1.27,
        recordedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      jest.spyOn(prisma.telemetry, 'create').mockResolvedValue(createdRecord);

      const result = await service.create(validDto);

      expect(result).toEqual(createdRecord);
      expect(prisma.telemetry.create).toHaveBeenCalledWith({
        data: {
          ...validDto,
          vpd: 1.27,
        },
      });
    });

    it('should use provided recordedAt when supplied', async () => {
      const dtoWithRecordedAt = {
        ...validDto,
        recordedAt: '2026-06-15T12:00:00.000Z',
      };

      jest.spyOn(prisma.telemetry, 'create').mockResolvedValue({} as any);

      await service.create(dtoWithRecordedAt);

      expect(prisma.telemetry.create).toHaveBeenCalledWith({
        data: {
          ...validDto,
          vpd: 1.27,
          recordedAt: new Date('2026-06-15T12:00:00.000Z'),
        },
      });
    });

    it('should throw BadRequestException when habitatId is missing', async () => {
      const dtoWithoutHabitat = {
        temperature: 25,
        humidity: 60,
      };

      await expect(service.create(dtoWithoutHabitat as any)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.telemetry.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when habitatId is null', async () => {
      const dtoWithNullHabitat = {
        habitatId: null,
        temperature: 25,
        humidity: 60,
      };

      await expect(service.create(dtoWithNullHabitat as any)).rejects.toThrow(
        BadRequestException,
      );

      expect(prisma.telemetry.create).not.toHaveBeenCalled();
    });

    describe('VPD calculation', () => {
      it('should calculate VPD correctly for typical values (25°C, 60%)', async () => {
        jest.spyOn(prisma.telemetry, 'create').mockResolvedValue({} as any);

        await service.create({ ...validDto, temperature: 25, humidity: 60 });

        const createCall = (prisma.telemetry.create as jest.Mock).mock
          .calls[0][0];
        expect(createCall.data.vpd).toBeCloseTo(1.27, 1);
      });

      it('should calculate VPD of 0 when humidity is 100%', async () => {
        jest.spyOn(prisma.telemetry, 'create').mockResolvedValue({} as any);

        await service.create({ ...validDto, temperature: 25, humidity: 100 });

        const createCall = (prisma.telemetry.create as jest.Mock).mock
          .calls[0][0];
        expect(createCall.data.vpd).toBe(0);
      });

      it('should have maximum VPD when humidity is 0%', async () => {
        jest.spyOn(prisma.telemetry, 'create').mockResolvedValue({} as any);

        await service.create({ ...validDto, temperature: 25, humidity: 0 });

        const createCall = (prisma.telemetry.create as jest.Mock).mock
          .calls[0][0];
        expect(createCall.data.vpd).toBeCloseTo(3.17, 1);
      });

      it('should calculate higher VPD at higher temperatures', async () => {
        jest.spyOn(prisma.telemetry, 'create').mockResolvedValue({} as any);

        await service.create({ ...validDto, temperature: 35, humidity: 60 });

        const createCall = (prisma.telemetry.create as jest.Mock).mock
          .calls[0][0];
        expect(createCall.data.vpd).toBeCloseTo(2.25, 1);
      });

      it('should calculate lower VPD at lower temperatures', async () => {
        jest.spyOn(prisma.telemetry, 'create').mockResolvedValue({} as any);

        await service.create({ ...validDto, temperature: 15, humidity: 60 });

        const createCall = (prisma.telemetry.create as jest.Mock).mock
          .calls[0][0];
        expect(createCall.data.vpd).toBeCloseTo(0.68, 1);
      });
    });
  });

  describe('createAuthorized', () => {
    const dto = { habitatId: 1, temperature: 25, humidity: 60 };

    beforeEach(() => {
      jest.spyOn(prisma.telemetry, 'create').mockResolvedValue({} as any);
    });

    it('API key: uses the habitat from the key and ignores the body', async () => {
      await service.createAuthorized({ ...dto, habitatId: 999 } as any, {
        apiKeyHabitatId: 5,
      });

      expect(prisma.habitat.findFirst).not.toHaveBeenCalled();
      expect(prisma.telemetry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ habitatId: 5 }),
      });
    });

    it('JWT: creates when the habitat belongs to the user', async () => {
      jest
        .spyOn(prisma.habitat, 'findFirst')
        .mockResolvedValue({ id: 1 } as any);

      await service.createAuthorized(dto as any, { userId: 7 });

      expect(prisma.habitat.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 7 },
        select: { id: true },
      });
      expect(prisma.telemetry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ habitatId: 1 }),
      });
    });

    it("JWT: 404 and nothing written for another user's habitat", async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);

      await expect(
        service.createAuthorized(dto as any, { userId: 2 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.telemetry.create).not.toHaveBeenCalled();
    });

    it('JWT: 400 when habitatId is missing', async () => {
      await expect(
        service.createAuthorized({ temperature: 25, humidity: 60 } as any, {
          userId: 7,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.telemetry.create).not.toHaveBeenCalled();
    });

    it('401 when neither API key nor user is present', async () => {
      await expect(service.createAuthorized(dto as any, {})).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.telemetry.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all telemetry records', async () => {
      const mockRecords = [
        { id: 1, temperature: 25, humidity: 60 },
        { id: 2, temperature: 26, humidity: 55 },
      ];

      jest
        .spyOn(prisma.telemetry, 'findMany')
        .mockResolvedValue(mockRecords as any);

      const result = await service.findAll();

      expect(result).toEqual(mockRecords);
      expect(prisma.telemetry.findMany).toHaveBeenCalled();
    });

    it('should return an empty array when no records exist', async () => {
      jest.spyOn(prisma.telemetry, 'findMany').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a telemetry record by id', async () => {
      const mockRecord = { id: 1, temperature: 25, humidity: 60 };

      jest
        .spyOn(prisma.telemetry, 'findUnique')
        .mockResolvedValue(mockRecord as any);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRecord);
      expect(prisma.telemetry.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return null when record is not found', async () => {
      jest.spyOn(prisma.telemetry, 'findUnique').mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('findLastByHabitatId', () => {
    it('should return the latest telemetry record for a habitat', async () => {
      const mockRecord = {
        id: 3,
        habitatId: 1,
        temperature: 25,
        humidity: 60,
        createdAt: new Date('2026-06-15T12:00:00.000Z'),
      };

      jest
        .spyOn(prisma.telemetry, 'findFirst')
        .mockResolvedValue(mockRecord as any);

      const result = await service.findLastByHabitatId(1);

      expect(result).toEqual(mockRecord);
      expect(prisma.telemetry.findFirst).toHaveBeenCalledWith({
        where: { habitatId: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return null when no telemetry exists for the habitat', async () => {
      jest.spyOn(prisma.telemetry, 'findFirst').mockResolvedValue(null);

      const result = await service.findLastByHabitatId(999);

      expect(result).toBeNull();
    });
  });
});
