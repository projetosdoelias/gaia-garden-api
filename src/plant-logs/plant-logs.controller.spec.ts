import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Request } from 'express';
import { PlantLogsController } from './plant-logs.controller';
import { PlantLogsService } from './plant-logs.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { PlantLogType } from './plant-log-types';

describe('PlantLogsController', () => {
  let controller: PlantLogsController;
  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const req = { user: { userId: 7, username: 'u' } } as unknown as Request & {
    user: { userId: number; username: string };
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantLogsController],
      providers: [
        { provide: PlantLogsService, useValue: service },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    }).compile();
    controller = module.get(PlantLogsController);
  });

  it('is protected by JwtGuard', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      PlantLogsController,
    ) as unknown[];
    expect(guards).toEqual([JwtGuard]);
  });

  it('passes userId from the JWT and route ids to the service', async () => {
    const dto = { type: PlantLogType.OBSERVATION, notes: 'x' };
    await controller.create(req, 1, 3, dto);
    expect(service.create).toHaveBeenCalledWith(1, 3, 7, dto);

    await controller.findAll(req, 1, 3, { type: PlantLogType.OBSERVATION });
    expect(service.findAll).toHaveBeenCalledWith(1, 3, 7, {
      type: PlantLogType.OBSERVATION,
    });

    await controller.findOne(req, 1, 3, 11);
    expect(service.findOne).toHaveBeenCalledWith(1, 3, 7, 11);

    await controller.update(req, 1, 3, 11, { healthScore: 5 });
    expect(service.update).toHaveBeenCalledWith(1, 3, 7, 11, {
      healthScore: 5,
    });

    await controller.remove(req, 1, 3, 11);
    expect(service.remove).toHaveBeenCalledWith(1, 3, 7, 11);
  });
});
