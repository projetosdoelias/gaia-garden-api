import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlantsService } from './plants.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PlantsService', () => {
  let service: PlantsService;
  let prisma: PrismaService;

  const mockHabitat = { id: 1, userId: 1 };
  const mockPlant = {
    id: 1,
    name: 'Tomato',
    description: 'A tomato plant',
    strain: null,
    germinatedAt: null,
    seedlingAt: null,
    vegetativeAt: null,
    floweringAt: null,
    habitatId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlantsService,
        {
          provide: PrismaService,
          useValue: {
            habitat: {
              findFirst: jest.fn(),
            },
            plant: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PlantsService>(PlantsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a plant linked to the habitat when the user owns it', async () => {
      const dto = {
        name: 'Tomato',
        description: 'A tomato plant',
      };
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'create').mockResolvedValue(mockPlant as any);

      const result = await service.create(1, 1, dto as any);

      expect(result).toEqual(mockPlant);
      expect(prisma.habitat.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        select: { id: true },
      });
      expect(prisma.plant.create).toHaveBeenCalledWith({
        data: {
          name: 'Tomato',
          description: 'A tomato plant',
          strain: undefined,
          germinatedAt: undefined,
          seedlingAt: undefined,
          vegetativeAt: undefined,
          floweringAt: undefined,
          habitat: { connect: { id: 1 } },
        },
      });
    });

    it('should convert date strings to Date objects when provided', async () => {
      const dto = {
        name: 'Tomato',
        germinatedAt: '2026-07-15T22:30:00.000Z',
      };
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'create').mockResolvedValue(mockPlant as any);

      await service.create(1, 1, dto as any);

      const createCall = (prisma.plant.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.germinatedAt).toEqual(
        new Date('2026-07-15T22:30:00.000Z'),
      );
    });

    it('should throw NotFoundException when the habitat does not belong to the user', async () => {
      const dto = { name: 'Tomato' };
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);

      await expect(service.create(1, 2, dto as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.plant.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return only non-deleted plants of the habitat', async () => {
      const activePlants = [mockPlant];
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'findMany').mockResolvedValue(activePlants as any);

      const result = await service.findAll(1, 1);

      expect(result).toEqual(activePlants);
      expect(prisma.plant.findMany).toHaveBeenCalledWith({
        where: { habitatId: 1, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw NotFoundException when habitat belongs to another user', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);

      await expect(service.findAll(1, 5)).rejects.toThrow(NotFoundException);
      expect(prisma.plant.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a specific plant when it belongs to the habitat', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'findFirst').mockResolvedValue(mockPlant as any);

      const result = await service.findOne(1, 1, 1);

      expect(result).toEqual(mockPlant);
      expect(prisma.plant.findFirst).toHaveBeenCalledWith({
        where: { id: 1, habitatId: 1, deletedAt: null },
      });
    });

    it('should throw NotFoundException when plant belongs to another habitat', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne(1, 1, 99)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when the plant is deleted', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne(1, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when habitat belongs to another user', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne(1, 5, 1)).rejects.toThrow(NotFoundException);
      expect(prisma.plant.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a plant when it belongs to the habitat', async () => {
      const dto = { name: 'Updated Tomato' };
      const updatedPlant = { ...mockPlant, name: 'Updated Tomato' };

      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'updateMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.plant, 'findFirst').mockResolvedValue(updatedPlant as any);

      const result = await service.update(1, 1, 1, dto as any);

      expect(result).toEqual(updatedPlant);
      expect(prisma.plant.updateMany).toHaveBeenCalledWith({
        where: { id: 1, habitatId: 1, deletedAt: null },
        data: {
          name: 'Updated Tomato',
          description: undefined,
          strain: undefined,
          germinatedAt: undefined,
          seedlingAt: undefined,
          vegetativeAt: undefined,
          floweringAt: undefined,
        },
      });
    });

    it('should throw NotFoundException when the plant is already deleted', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'updateMany').mockResolvedValue({ count: 0 } as any);

      await expect(service.update(1, 1, 1, { name: 'x' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when the plant belongs to another habitat', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'updateMany').mockResolvedValue({ count: 0 } as any);

      await expect(service.update(1, 1, 99, { name: 'x' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when habitat belongs to another user', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);

      await expect(service.update(1, 5, 1, { name: 'x' } as any)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.plant.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete a plant by setting deletedAt when it belongs to the habitat', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'updateMany').mockResolvedValue({ count: 1 } as any);

      const result = await service.remove(1, 1, 1);

      expect(result).toEqual({ deleted: true });
      expect(prisma.plant.updateMany).toHaveBeenCalledWith({
        where: { id: 1, habitatId: 1, deletedAt: null },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when the plant is already deleted', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'updateMany').mockResolvedValue({ count: 0 } as any);

      await expect(service.remove(1, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when the plant belongs to another habitat', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.plant, 'updateMany').mockResolvedValue({ count: 0 } as any);

      await expect(service.remove(1, 1, 99)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when habitat belongs to another user', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);

      await expect(service.remove(1, 5, 1)).rejects.toThrow(NotFoundException);
      expect(prisma.plant.updateMany).not.toHaveBeenCalled();
    });
  });
});