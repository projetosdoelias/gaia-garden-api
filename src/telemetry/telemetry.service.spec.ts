import { Test, TestingModule } from '@nestjs/testing';
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
            telemetry: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
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
    it('should create a telemetry record', async () => {
      const createTelemetryDto = {
        habitatId: 1,
        recordedAt: new Date(),
        temperature: 25,
        humidity: 60,
        vpd: 1.5,
      };

      await service.create(createTelemetryDto);
      expect(prisma.telemetry.create).toHaveBeenCalledWith({
        data: createTelemetryDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all telemetry records', async () => {
      await service.findAll();
      expect(prisma.telemetry.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a telemetry record by id', async () => {
      const id = 1;
      await service.findOne(id);
      expect(prisma.telemetry.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });
});
