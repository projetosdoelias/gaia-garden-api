import { Test, TestingModule } from '@nestjs/testing';
import { HabitatService } from './habitat.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HabitatService', () => {
  let service: HabitatService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitatService,
        {
          provide: PrismaService,
          useValue: {
            habitat: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              updateMany: jest.fn(),
              deleteMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<HabitatService>(HabitatService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a habitat linked to a user', async () => {
      const dto = { title: 'My Terrarium', description: 'A test terrarium' };
      const userId = 1;
      const mockHabitat = {
        id: 1,
        ...dto,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.habitat, 'create').mockResolvedValue(mockHabitat);

      const result = await service.create({ ...dto, userId });

      expect(result).toEqual(mockHabitat);
      expect(prisma.habitat.create).toHaveBeenCalledWith({
        data: {
          title: 'My Terrarium',
          description: 'A test terrarium',
          user: { connect: { id: userId } },
        },
      });
    });

    it('should create a habitat without description', async () => {
      const dto = { title: 'Minimal Terrarium' };
      const userId = 1;

      jest.spyOn(prisma.habitat, 'create').mockResolvedValue({} as any);

      await service.create({ ...dto, userId });

      expect(prisma.habitat.create).toHaveBeenCalledWith({
        data: {
          title: 'Minimal Terrarium',
          description: undefined,
          user: { connect: { id: userId } },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return all habitats for a given user', async () => {
      const userId = 1;
      const mockHabitats = [
        { id: 1, title: 'Habitat 1', userId },
        { id: 2, title: 'Habitat 2', userId },
      ];

      jest
        .spyOn(prisma.habitat, 'findMany')
        .mockResolvedValue(mockHabitats as any);

      const result = await service.findAll(userId);

      expect(result).toEqual(mockHabitats);
      expect(prisma.habitat.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('should return an empty array when user has no habitats', async () => {
      jest.spyOn(prisma.habitat, 'findMany').mockResolvedValue([]);

      const result = await service.findAll(999);

      expect(result).toEqual([]);
    });

    it('should not return habitats from other users', async () => {
      jest.spyOn(prisma.habitat, 'findMany').mockResolvedValue([]);

      const result = await service.findAll(2);

      expect(result).toEqual([]);
      expect(prisma.habitat.findMany).toHaveBeenCalledWith({
        where: { userId: 2 },
      });
    });
  });

  describe('findOne', () => {
    it('should return a habitat when it belongs to the user', async () => {
      const mockHabitat = { id: 1, title: 'Habitat 1', userId: 1 };

      jest
        .spyOn(prisma.habitat, 'findFirst')
        .mockResolvedValue(mockHabitat as any);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockHabitat);
      expect(prisma.habitat.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
      });
    });

    it('should return null when habitat does not belong to the user', async () => {
      jest.spyOn(prisma.habitat, 'findFirst').mockResolvedValue(null);

      const result = await service.findOne(1, 2);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a habitat when it belongs to the user', async () => {
      const updateDto = { title: 'Updated Title' };
      const mockUpdateResult = { count: 1 };

      jest
        .spyOn(prisma.habitat, 'updateMany')
        .mockResolvedValue(mockUpdateResult);

      const result = await service.update(1, 1, updateDto);

      expect(result).toEqual(mockUpdateResult);
      expect(prisma.habitat.updateMany).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        data: { title: 'Updated Title' },
      });
    });
    describe('remove', () => {
      it('should delete a habitat when it belongs to the user', async () => {
        const mockDeleteResult = { count: 1 };

        jest
          .spyOn(prisma.habitat, 'deleteMany')
          .mockResolvedValue(mockDeleteResult);

        const result = await service.remove(1, 1);

        expect(result).toEqual(mockDeleteResult);
        expect(prisma.habitat.deleteMany).toHaveBeenCalledWith({
          where: { id: 1, userId: 1 },
        });
      });

      it('should delete nothing when habitat does not belong to the user', async () => {
        const mockDeleteResult = { count: 0 };

        jest
          .spyOn(prisma.habitat, 'deleteMany')
          .mockResolvedValue(mockDeleteResult);

        const result = await service.remove(1, 2);

        expect(result).toEqual({ count: 0 });
      });
    });
  });

  it('should update nothing when habitat does not belong to the user', async () => {
    const updateDto = { title: 'Should Not Update' };
    const mockUpdateResult = { count: 0 };

    jest
      .spyOn(prisma.habitat, 'updateMany')
      .mockResolvedValue(mockUpdateResult);

    const result = await service.update(1, 2, updateDto);

    expect(result).toEqual({ count: 0 });
  });
});
