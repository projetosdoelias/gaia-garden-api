import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PlantsController } from './plants.controller';
import { PlantsService } from './plants.service';

describe('PlantsController', () => {
  let controller: PlantsController;
  let service: PlantsService;

  const mockRequest = (overrides) =>
    ({ user: { userId: 1, username: 'testuser' }, ...overrides }) as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PlantsController],
      providers: [
        { provide: PlantsService, useValue: { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), remove: jest.fn() } },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        JwtGuard,
      ],
    }).compile();
    controller = module.get(PlantsController);
    service = module.get(PlantsService);
  });

  it('should be defined', () => { expect(controller).toBeDefined(); });

  it('create should pass params to service', async () => {
    const dto = { name: 'Tomato' };
    jest.spyOn(service, 'create').mockResolvedValue({ id: 1, ...dto, habitatId: 1 } as any);
    const result = await controller.create(mockRequest(), '1', dto as any);
    expect(result).toEqual({ id: 1, ...dto, habitatId: 1 });
    expect(service.create).toHaveBeenCalledWith(1, 1, dto);
  });

  it('findAll should pass habitatId and userId', async () => {
    jest.spyOn(service, 'findAll').mockResolvedValue([{ id: 1, name: 'Tomato' }] as any);
    const result = await controller.findAll(mockRequest(), '1');
    expect(result).toHaveLength(1);
    expect(service.findAll).toHaveBeenCalledWith(1, 1);
  });

  it('findOne should convert string params to numbers', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 1, name: 'Tomato' } as any);
    const result = await controller.findOne(mockRequest(), '1', '1');
    expect(result).toEqual({ id: 1, name: 'Tomato' });
    expect(service.findOne).toHaveBeenCalledWith(1, 1, 1);
  });

  it('update should convert string params to numbers', async () => {
    jest.spyOn(service, 'update').mockResolvedValue({ id: 1, name: 'Updated' } as any);
    const result = await controller.update(mockRequest(), '1', '1', { name: 'Updated' } as any);
    expect(result).toEqual({ id: 1, name: 'Updated' });
    expect(service.update).toHaveBeenCalledWith(1, 1, 1, { name: 'Updated' });
  });

  it('remove should convert string params to numbers', async () => {
    jest.spyOn(service, 'remove').mockResolvedValue({ deleted: true } as any);
    const result = await controller.remove(mockRequest(), '1', '1');
    expect(result).toEqual({ deleted: true });
    expect(service.remove).toHaveBeenCalledWith(1, 1, 1);
  });
});
