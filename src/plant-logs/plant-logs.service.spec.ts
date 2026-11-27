import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PlantLogsService } from './plant-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlantLogType } from './plant-log-types';

describe('PlantLogsService', () => {
  let service: PlantLogsService;
  const prisma = {
    habitat: { findFirst: jest.fn() },
    plant: { findFirst: jest.fn() },
    plantLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const habitatId = 1;
  const plantId = 3;
  const userId = 7;
  const logId = 11;

  const mockLog = {
    id: logId,
    plantId,
    type: PlantLogType.OBSERVATION,
    notes: 'Looks healthy',
    healthScore: 4,
    details: null,
    occurredAt: new Date('2026-11-19T10:00:00.000Z'),
    createdAt: new Date('2026-11-19T10:00:00.000Z'),
    updatedAt: new Date('2026-11-19T10:00:00.000Z'),
    deletedAt: null,
  };

  const grantAccess = () => {
    prisma.habitat.findFirst.mockResolvedValue({ id: habitatId });
    prisma.plant.findFirst.mockResolvedValue({ id: plantId });
  };

  const expectNoLogQueries = () => {
    expect(prisma.plantLog.create).not.toHaveBeenCalled();
    expect(prisma.plantLog.findMany).not.toHaveBeenCalled();
    expect(prisma.plantLog.findFirst).not.toHaveBeenCalled();
    expect(prisma.plantLog.updateMany).not.toHaveBeenCalled();
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantLogsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(PlantLogsService);
  });

  describe('ownership', () => {
    const calls: Array<[string, () => Promise<unknown>]> = [
      [
        'create',
        () =>
          service.create(habitatId, plantId, userId, {
            type: PlantLogType.OBSERVATION,
            notes: 'x',
          }),
      ],
      ['findAll', () => service.findAll(habitatId, plantId, userId, {})],
      ['findOne', () => service.findOne(habitatId, plantId, userId, logId)],
      [
        'update',
        () => service.update(habitatId, plantId, userId, logId, { notes: 'y' }),
      ],
      ['remove', () => service.remove(habitatId, plantId, userId, logId)],
    ];

    it.each(calls)(
      '%s returns 404 when the habitat is not owned by the user',
      async (_name, call) => {
        prisma.habitat.findFirst.mockResolvedValue(null);

        await expect(call()).rejects.toThrow(
          new NotFoundException('Habitat not found'),
        );
        expect(prisma.habitat.findFirst).toHaveBeenCalledWith({
          where: { id: habitatId, userId },
          select: { id: true },
        });
        expect(prisma.plant.findFirst).not.toHaveBeenCalled();
        expectNoLogQueries();
      },
    );

    it.each(calls)(
      '%s returns 404 when the plant is not in the habitat or is soft-deleted',
      async (_name, call) => {
        prisma.habitat.findFirst.mockResolvedValue({ id: habitatId });
        prisma.plant.findFirst.mockResolvedValue(null);

        await expect(call()).rejects.toThrow(
          new NotFoundException('Plant not found'),
        );
        expect(prisma.plant.findFirst).toHaveBeenCalledWith({
          where: { id: plantId, habitatId, deletedAt: null },
          select: { id: true },
        });
        expectNoLogQueries();
      },
    );
  });

  describe('create', () => {
    it('creates an OBSERVATION linked to the plant', async () => {
      grantAccess();
      prisma.plantLog.create.mockResolvedValue(mockLog);

      const result = await service.create(habitatId, plantId, userId, {
        type: PlantLogType.OBSERVATION,
        notes: 'Looks healthy',
        healthScore: 4,
        occurredAt: '2026-11-19T10:00:00.000Z',
      });

      expect(result).toEqual(mockLog);
      expect(prisma.plantLog.create).toHaveBeenCalledWith({
        data: {
          type: PlantLogType.OBSERVATION,
          notes: 'Looks healthy',
          healthScore: 4,
          details: undefined,
          occurredAt: new Date('2026-11-19T10:00:00.000Z'),
          plant: { connect: { id: plantId } },
        },
      });
    });

    it('leaves occurredAt undefined so the DB default (now) applies', async () => {
      grantAccess();
      prisma.plantLog.create.mockResolvedValue(mockLog);

      await service.create(habitatId, plantId, userId, {
        type: PlantLogType.OBSERVATION,
        healthScore: 3,
      });

      const [[args]] = prisma.plantLog.create.mock.calls as [
        [{ data: Record<string, unknown> }],
      ];
      expect(args.data.occurredAt).toBeUndefined();
      expect(args.data.notes).toBeUndefined();
    });
  });

  describe('findAll', () => {
    const orderBy = [{ occurredAt: 'desc' }, { id: 'desc' }];

    beforeEach(() => {
      grantAccess();
      prisma.plantLog.findMany.mockResolvedValue([mockLog]);
    });

    it('lists active logs of the plant, newest occurredAt first', async () => {
      const result = await service.findAll(habitatId, plantId, userId, {});

      expect(result).toEqual([mockLog]);
      expect(prisma.plantLog.findMany).toHaveBeenCalledWith({
        where: { plantId, deletedAt: null, type: undefined },
        orderBy,
      });
    });

    it('applies from (inclusive), to (exclusive) and type filters', async () => {
      await service.findAll(habitatId, plantId, userId, {
        from: '2026-11-01T00:00:00Z',
        to: '2026-12-01T00:00:00Z',
        type: PlantLogType.OBSERVATION,
      });

      expect(prisma.plantLog.findMany).toHaveBeenCalledWith({
        where: {
          plantId,
          deletedAt: null,
          type: PlantLogType.OBSERVATION,
          occurredAt: {
            gte: new Date('2026-11-01T00:00:00Z'),
            lt: new Date('2026-12-01T00:00:00Z'),
          },
        },
        orderBy,
      });
    });

    it('supports an open-ended range (from only)', async () => {
      await service.findAll(habitatId, plantId, userId, {
        from: '2026-11-01T00:00:00Z',
      });

      expect(prisma.plantLog.findMany).toHaveBeenCalledWith({
        where: {
          plantId,
          deletedAt: null,
          type: undefined,
          occurredAt: { gte: new Date('2026-11-01T00:00:00Z'), lt: undefined },
        },
        orderBy,
      });
    });

    it('rejects from >= to with 400', async () => {
      await expect(
        service.findAll(habitatId, plantId, userId, {
          from: '2026-12-01T00:00:00Z',
          to: '2026-12-01T00:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.plantLog.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns an active log of the plant', async () => {
      grantAccess();
      prisma.plantLog.findFirst.mockResolvedValue(mockLog);

      await expect(
        service.findOne(habitatId, plantId, userId, logId),
      ).resolves.toEqual(mockLog);
      expect(prisma.plantLog.findFirst).toHaveBeenCalledWith({
        where: { id: logId, plantId, deletedAt: null },
      });
    });

    it('returns 404 when the log is missing, soft-deleted or on another plant', async () => {
      grantAccess();
      prisma.plantLog.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(habitatId, plantId, userId, logId),
      ).rejects.toThrow(new NotFoundException('Plant log not found'));
    });
  });

  describe('update', () => {
    it('updates with updateMany scoped to the plant and returns the fresh row', async () => {
      grantAccess();
      prisma.plantLog.updateMany.mockResolvedValue({ count: 1 });
      const updated = { ...mockLog, healthScore: 5 };
      prisma.plantLog.findFirst.mockResolvedValue(updated);

      const result = await service.update(habitatId, plantId, userId, logId, {
        healthScore: 5,
      });

      expect(result).toEqual(updated);
      expect(prisma.plantLog.updateMany).toHaveBeenCalledWith({
        where: { id: logId, plantId, deletedAt: null },
        data: { notes: undefined, healthScore: 5, occurredAt: undefined },
      });
    });

    it('returns 404 when no active log matches', async () => {
      grantAccess();
      prisma.plantLog.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(habitatId, plantId, userId, logId, { notes: 'y' }),
      ).rejects.toThrow(new NotFoundException('Plant log not found'));
      expect(prisma.plantLog.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('soft deletes by setting deletedAt', async () => {
      grantAccess();
      prisma.plantLog.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        service.remove(habitatId, plantId, userId, logId),
      ).resolves.toEqual({ deleted: true });
      expect(prisma.plantLog.updateMany).toHaveBeenCalledWith({
        where: { id: logId, plantId, deletedAt: null },
        data: { deletedAt: expect.any(Date) as Date },
      });
    });

    it('returns 404 when the log is already deleted', async () => {
      grantAccess();
      prisma.plantLog.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.remove(habitatId, plantId, userId, logId),
      ).rejects.toThrow(new NotFoundException('Plant log not found'));
    });
  });
});
