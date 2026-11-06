import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: PrismaService;

  const mockHabitat = { id: 1, userId: 1 };
  const mockEvent = {
    id: 1,
    description: 'Watering the plants',
    habitatId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: {
            habitat: { findFirst: jest.fn() },
            event: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an event linked to the habitat when the user owns it', async () => {
      const dto = { description: 'Watering the plants' };
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'create').mockResolvedValue(mockEvent as any);
      const result = await service.create(1, 1, dto);
      expect(result).toEqual(mockEvent);
      expect(prisma.habitat.findFirst).toHaveBeenCalledWith({ where: { id: 1, userId: 1 }, select: { id: true } });
      expect(prisma.event.create).toHaveBeenCalledWith({ data: { description: 'Watering the plants', habitat: { connect: { id: 1 } } } });
    });

    it('should throw NotFoundException when the habitat does not belong to the user', async () => {
      const dto = { description: 'Watering the plants' };
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);
      await expect(service.create(1, 2, dto)).rejects.toThrow(NotFoundException);
      expect(prisma.event.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return only non-deleted events of the habitat', async () => {
      const activeEvents = [mockEvent];
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'findMany').mockResolvedValue(activeEvents as any);
      const result = await service.findAll(1, 1);
      expect(result).toEqual(activeEvents);
      expect(prisma.event.findMany).toHaveBeenCalledWith({ where: { habitatId: 1, deletedAt: null }, orderBy: { createdAt: 'desc' } });
    });

    it('should throw NotFoundException when habitat belongs to another user', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);
      await expect(service.findAll(1, 5)).rejects.toThrow(NotFoundException);
      expect(prisma.event.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a specific event when it belongs to the habitat', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'findFirst').mockResolvedValue(mockEvent as any);
      const result = await service.findOne(1, 1, 1);
      expect(result).toEqual(mockEvent);
      expect(prisma.event.findFirst).toHaveBeenCalledWith({ where: { id: 1, habitatId: 1, deletedAt: null } });
    });

    it('should throw NotFoundException when event belongs to another habitat', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'findFirst').mockResolvedValue(null);
      await expect(service.findOne(1, 1, 99)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when the event is deleted', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'findFirst').mockResolvedValue(null);
      await expect(service.findOne(1, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when habitat belongs to another user', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);
      await expect(service.findOne(1, 5, 1)).rejects.toThrow(NotFoundException);
      expect(prisma.event.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an event when it belongs to the habitat', async () => {
      const dto = { description: 'Feeding the plants' };
      const updatedEvent = { ...mockEvent, description: 'Feeding the plants' };
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'updateMany').mockResolvedValue({ count: 1 } as any);
      jest.spyOn(prisma.event, 'findFirst').mockResolvedValue(updatedEvent as any);
      const result = await service.update(1, 1, 1, dto as any);
      expect(result).toEqual(updatedEvent);
      expect(prisma.event.updateMany).toHaveBeenCalledWith({ where: { id: 1, habitatId: 1, deletedAt: null }, data: { description: 'Feeding the plants' } });
    });

    it('should throw NotFoundException when the event is already deleted', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'updateMany').mockResolvedValue({ count: 0 } as any);
      await expect(service.update(1, 1, 1, { description: 'x' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when the event belongs to another habitat', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'updateMany').mockResolvedValue({ count: 0 } as any);
      await expect(service.update(1, 1, 99, { description: 'x' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when habitat belongs to another user', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);
      await expect(service.update(1, 5, 1, { description: 'x' } as any)).rejects.toThrow(NotFoundException);
      expect(prisma.event.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete an event by setting deletedAt when it belongs to the habitat', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'updateMany').mockResolvedValue({ count: 1 } as any);
      const result = await service.remove(1, 1, 1);
      expect(result).toEqual({ deleted: true });
      expect(prisma.event.updateMany).toHaveBeenCalledWith({ where: { id: 1, habitatId: 1, deletedAt: null }, data: { deletedAt: expect.any(Date) } });
    });

    it('should throw NotFoundException when the event is already deleted', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'updateMany').mockResolvedValue({ count: 0 } as any);
      await expect(service.remove(1, 1, 1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when the event belongs to another habitat', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(mockHabitat as any);
      jest.spyOn(prisma.event, 'updateMany').mockResolvedValue({ count: 0 } as any);
      await expect(service.remove(1, 1, 99)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when habitat belongs to another user', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);
      await expect(service.remove(1, 5, 1)).rejects.toThrow(NotFoundException);
      expect(prisma.event.updateMany).not.toHaveBeenCalled();
    });
  });
});
