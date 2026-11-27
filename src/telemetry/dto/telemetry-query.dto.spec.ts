import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  TelemetryBucket,
  TelemetryMetric,
  TelemetrySeriesQueryDto,
} from './telemetry-series-query.dto';
import { TelemetryListQueryDto } from './telemetry-list-query.dto';

async function errorsFor<T extends object>(
  cls: new () => T,
  plain: Record<string, unknown>,
): Promise<string[]> {
  const errors = await validate(plainToInstance(cls, plain));
  return errors.map((e) => e.property);
}

describe('TelemetrySeriesQueryDto', () => {
  const valid = {
    from: '2026-11-01T00:00:00.000Z',
    to: '2026-11-02T00:00:00.000Z',
  };

  it('accepts minimal input and applies defaults', async () => {
    const dto = plainToInstance(TelemetrySeriesQueryDto, valid);
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.metric).toBe(TelemetryMetric.VPD);
    expect(dto.tz).toBe('UTC');
    expect(dto.bucket).toBeUndefined();
  });

  it('accepts explicit bucket, metric and tz', async () => {
    expect(
      await errorsFor(TelemetrySeriesQueryDto, {
        ...valid,
        bucket: TelemetryBucket.DAY,
        metric: 'vpd',
        tz: 'America/Sao_Paulo',
      }),
    ).toEqual([]);
  });

  it('requires from and to', async () => {
    expect(await errorsFor(TelemetrySeriesQueryDto, {})).toEqual(
      expect.arrayContaining(['from', 'to']),
    );
  });

  it.each([
    'yesterday',
    '2026-13-01T00:00:00Z',
    '1700000000',
    '2026-W45',
    '2026-W45-1',
    '2026-305',
    '2026-11-01',
    '2026-11-01T00:00:00',
  ])('rejects non-ISO from %s', async (from) => {
    expect(
      await errorsFor(TelemetrySeriesQueryDto, { ...valid, from }),
    ).toEqual(['from']);
  });

  it('rejects unknown bucket', async () => {
    expect(
      await errorsFor(TelemetrySeriesQueryDto, { ...valid, bucket: 'week' }),
    ).toEqual(['bucket']);
  });

  it('rejects unknown metric', async () => {
    expect(
      await errorsFor(TelemetrySeriesQueryDto, {
        ...valid,
        metric: 'temperature',
      }),
    ).toEqual(['metric']);
  });

  it.each(['UTC', 'Etc/UTC', 'Asia/Kolkata', 'Asia/Calcutta', 'Europe/Kyiv'])(
    'accepts tz %p',
    async (tz) => {
      expect(
        await errorsFor(TelemetrySeriesQueryDto, { ...valid, tz }),
      ).toEqual([]);
    },
  );

  it('accepts from/to with a numeric offset', async () => {
    expect(
      await errorsFor(TelemetrySeriesQueryDto, {
        from: '2026-11-01T00:00:00-03:00',
        to: '2026-11-02T00:00-03:00',
      }),
    ).toEqual([]);
  });

  it.each(['Mars/Base', '+01:00', 'UTC+3', "UTC'; DROP TABLE x;--", ''])(
    'rejects invalid tz %p',
    async (tz) => {
      expect(
        await errorsFor(TelemetrySeriesQueryDto, { ...valid, tz }),
      ).toEqual(['tz']);
    },
  );
});

describe('TelemetryListQueryDto', () => {
  it('defaults limit to 50 and converts string query values', async () => {
    const dto = plainToInstance(TelemetryListQueryDto, {});
    expect(dto.limit).toBe(50);
    const fromQuery = plainToInstance(TelemetryListQueryDto, { limit: '200' });
    expect(await validate(fromQuery)).toHaveLength(0);
    expect(fromQuery.limit).toBe(200);
  });

  it.each(['0', '201', '1.5', 'abc'])('rejects limit %s', async (limit) => {
    expect(await errorsFor(TelemetryListQueryDto, { limit })).toEqual([
      'limit',
    ]);
  });

  it('rejects non-ISO from/to', async () => {
    expect(
      await errorsFor(TelemetryListQueryDto, { from: '2026-W45', to: 'y' }),
    ).toEqual(['from', 'to']);
  });
});
