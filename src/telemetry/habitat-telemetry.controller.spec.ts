import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Request } from 'express';
import { HabitatTelemetryController } from './habitat-telemetry.controller';
import { HabitatTelemetryService } from './habitat-telemetry.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { TelemetryMetric } from './dto/telemetry-series-query.dto';

describe('HabitatTelemetryController', () => {
  let controller: HabitatTelemetryController;
  const service = { list: jest.fn(), series: jest.fn() };
  const req = { user: { userId: 7, username: 'u' } } as unknown as Request & {
    user: { userId: number; username: string };
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HabitatTelemetryController],
      providers: [
        { provide: HabitatTelemetryService, useValue: service },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      ],
    }).compile();
    controller = module.get(HabitatTelemetryController);
  });

  it('is protected by JwtGuard only', () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      HabitatTelemetryController,
    ) as unknown[];
    expect(guards).toEqual([JwtGuard]);
  });

  it('list passes userId from req.user', async () => {
    service.list.mockResolvedValue({ data: [], nextCursor: null });
    const query = { limit: 50 };

    await controller.list(req, 3, query);

    expect(service.list).toHaveBeenCalledWith(3, 7, query);
  });

  it('series passes userId from req.user', async () => {
    const query = {
      from: '2026-11-01T00:00:00.000Z',
      to: '2026-11-02T00:00:00.000Z',
      metric: TelemetryMetric.VPD,
      tz: 'UTC',
    };

    await controller.series(req, 3, query);

    expect(service.series).toHaveBeenCalledWith(3, 7, query);
  });
});
