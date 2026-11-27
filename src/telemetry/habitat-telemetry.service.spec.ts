import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  decodeCursor,
  encodeCursor,
  HabitatTelemetryService,
  mapSeriesRow,
  resolveBucket,
} from './habitat-telemetry.service';
import {
  TelemetryBucket,
  TelemetryMetric,
} from './dto/telemetry-series-query.dto';

const HOUR = 60 * 60 * 1000;

describe('HabitatTelemetryService', () => {
  let service: HabitatTelemetryService;
  let prisma: {
    habitat: { findFirst: jest.Mock };
    telemetry: { findMany: jest.Mock };
    $queryRaw: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      habitat: { findFirst: jest.fn().mockResolvedValue({ id: 1 }) },
      telemetry: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitatTelemetryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(HabitatTelemetryService);
  });

  describe('resolveBucket', () => {
    const from = new Date('2026-11-01T00:00:00Z');

    it('picks hour for a range of exactly 48h', () => {
      expect(resolveBucket(from, new Date(from.getTime() + 48 * HOUR))).toBe(
        TelemetryBucket.HOUR,
      );
    });

    it('picks day for a range just over 48h', () => {
      expect(
        resolveBucket(from, new Date(from.getTime() + 48 * HOUR + 1)),
      ).toBe(TelemetryBucket.DAY);
    });

    it('keeps an explicitly requested bucket', () => {
      expect(
        resolveBucket(
          from,
          new Date(from.getTime() + HOUR),
          TelemetryBucket.DAY,
        ),
      ).toBe(TelemetryBucket.DAY);
    });
  });

  describe('mapSeriesRow', () => {
    it('rounds values to 2 decimals and serializes bucketStart', () => {
      expect(
        mapSeriesRow({
          bucketStart: new Date('2026-11-01T03:00:00Z'),
          avg: 1.1665,
          min: 0.994,
          max: 1.3351,
          count: 2,
        }),
      ).toEqual({
        bucketStart: '2026-11-01T03:00:00.000Z',
        avg: 1.17,
        min: 0.99,
        max: 1.34,
        count: 2,
      });
    });
  });

  describe('cursor', () => {
    it('round-trips recordedAt and id', () => {
      const cursor = { recordedAt: new Date('2026-11-19T12:00:00Z'), id: 42 };
      expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
    });

    it.each([
      'not-base64-json',
      Buffer.from('{"r":"nope","i":1}').toString('base64url'),
      Buffer.from('{"r":"2026-11-19T12:00:00Z","i":-1}').toString('base64url'),
      Buffer.from('{"r":"2026-11-19T12:00:00Z","i":1.5}').toString('base64url'),
      Buffer.from('null').toString('base64url'),
    ])('rejects invalid cursor %s', (raw) => {
      expect(() => decodeCursor(raw)).toThrow(BadRequestException);
    });
  });

  describe('series', () => {
    const query = {
      from: '2026-11-01T00:00:00.000Z',
      to: '2026-11-02T00:00:00.000Z',
      metric: TelemetryMetric.VPD,
      tz: 'America/Sao_Paulo',
    };

    it('checks ownership with userId and returns mapped points', async () => {
      prisma.$queryRaw.mockResolvedValue([
        {
          bucketStart: new Date('2026-11-01T02:00:00Z'),
          avg: 1.1665,
          min: 1,
          max: 1.333,
          count: 2,
        },
      ]);

      const result = await service.series(1, 7, query);

      expect(prisma.habitat.findFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 7 },
        select: { id: true },
      });
      expect(result).toEqual({
        habitatId: 1,
        metric: 'vpd',
        bucket: 'hour',
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-02T00:00:00.000Z',
        tz: 'America/Sao_Paulo',
        points: [
          {
            bucketStart: '2026-11-01T02:00:00.000Z',
            avg: 1.17,
            min: 1,
            max: 1.33,
            count: 2,
          },
        ],
      });
    });

    it('binds user input as parameters, never as SQL text', async () => {
      await service.series(1, 7, { ...query, bucket: TelemetryBucket.DAY });

      const [strings, ...values] = prisma.$queryRaw.mock.calls[0] as [
        TemplateStringsArray,
        ...unknown[],
      ];
      const sqlText = strings.join('?');
      expect(sqlText).not.toContain('America/Sao_Paulo');
      expect(sqlText).not.toContain('2026-11-01');
      expect(values).toEqual(
        expect.arrayContaining([
          'day',
          'America/Sao_Paulo',
          1,
          '2026-11-01T00:00:00.000Z',
          '2026-11-02T00:00:00.000Z',
        ]),
      );
    });

    it('returns 404 and does not query when habitat is not owned', async () => {
      prisma.habitat.findFirst.mockResolvedValue(null);

      await expect(service.series(1, 2, query)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('rejects from >= to', async () => {
      await expect(
        service.series(1, 7, { ...query, to: query.from }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects ranges over 90 days', async () => {
      await expect(
        service.series(1, 7, { ...query, to: '2027-01-30T00:00:01.000Z' }),
      ).rejects.toThrow('Range must not exceed 90 days');
    });

    it('accepts a range of exactly 90 days and uses day buckets', async () => {
      const result = await service.series(1, 7, {
        ...query,
        to: '2027-01-30T00:00:00.000Z',
      });
      expect(result.bucket).toBe(TelemetryBucket.DAY);
    });
  });

  describe('list', () => {
    const row = (id: number, iso: string) => ({
      id,
      habitatId: 1,
      recordedAt: new Date(iso),
    });

    it('returns 404 and does not query when habitat is not owned', async () => {
      prisma.habitat.findFirst.mockResolvedValue(null);

      await expect(service.list(1, 2, { limit: 50 })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.telemetry.findMany).not.toHaveBeenCalled();
    });

    it('fetches limit + 1 with stable ordering and returns nextCursor', async () => {
      prisma.telemetry.findMany.mockResolvedValue([
        row(5, '2026-11-19T12:00:00Z'),
        row(4, '2026-11-19T11:00:00Z'),
        row(3, '2026-11-19T11:00:00Z'),
      ]);

      const result = await service.list(1, 7, { limit: 2 });

      expect(prisma.telemetry.findMany).toHaveBeenCalledWith({
        where: { habitatId: 1 },
        orderBy: [{ recordedAt: 'desc' }, { id: 'desc' }],
        take: 3,
      });
      expect(result.data.map((r) => r.id)).toEqual([5, 4]);
      expect(decodeCursor(result.nextCursor as string)).toEqual({
        recordedAt: new Date('2026-11-19T11:00:00Z'),
        id: 4,
      });
    });

    it('returns nextCursor null on the last page', async () => {
      prisma.telemetry.findMany.mockResolvedValue([
        row(1, '2026-11-19T10:00:00Z'),
      ]);

      const result = await service.list(1, 7, { limit: 2 });

      expect(result).toEqual({
        data: [row(1, '2026-11-19T10:00:00Z')],
        nextCursor: null,
      });
    });

    it('applies cursor (with id tie-breaker) and from/to filters', async () => {
      const cursor = encodeCursor({
        recordedAt: new Date('2026-11-19T11:00:00Z'),
        id: 4,
      });

      await service.list(1, 7, {
        limit: 2,
        cursor,
        from: '2026-11-19T00:00:00.000Z',
        to: '2026-11-20T00:00:00.000Z',
      });

      expect(prisma.telemetry.findMany).toHaveBeenCalledWith({
        where: {
          habitatId: 1,
          recordedAt: {
            gte: new Date('2026-11-19T00:00:00.000Z'),
            lt: new Date('2026-11-20T00:00:00.000Z'),
            lte: new Date('2026-11-19T11:00:00Z'),
          },
          OR: [
            { recordedAt: { lt: new Date('2026-11-19T11:00:00Z') } },
            { recordedAt: new Date('2026-11-19T11:00:00Z'), id: { lt: 4 } },
          ],
        },
        orderBy: [{ recordedAt: 'desc' }, { id: 'desc' }],
        take: 3,
      });
    });

    it('rejects an invalid cursor before querying', async () => {
      await expect(
        service.list(1, 7, { limit: 2, cursor: 'garbage' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.telemetry.findMany).not.toHaveBeenCalled();
    });

    it('rejects from >= to', async () => {
      await expect(
        service.list(1, 7, {
          limit: 2,
          from: '2026-11-20T00:00:00.000Z',
          to: '2026-11-19T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
