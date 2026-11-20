import { IsString } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePlantLogDto } from './create-plant-log.dto';
import { UpdatePlantLogDto } from './update-plant-log.dto';
import { PLANT_LOG_TYPE_CONFIG, PlantLogType } from '../plant-log-types';

const errorsFor = async <T extends object>(
  cls: new () => T,
  body: Record<string, unknown>,
) => {
  const errors = await validate(plainToInstance(cls, body), {
    whitelist: true,
  });
  return Object.fromEntries(
    errors.map((e) => [e.property, Object.values(e.constraints ?? {})]),
  );
};

const past = '2026-01-01T00:00:00.000Z';

describe('CreatePlantLogDto', () => {
  it('accepts an OBSERVATION with notes and healthScore', async () => {
    expect(
      await errorsFor(CreatePlantLogDto, {
        type: 'OBSERVATION',
        notes: 'Looks good',
        healthScore: 4,
        occurredAt: past,
      }),
    ).toEqual({});
  });

  it.each([{ notes: 'only notes' }, { healthScore: 1 }, { healthScore: 5 }])(
    'accepts an OBSERVATION with %o',
    async (fields) => {
      expect(
        await errorsFor(CreatePlantLogDto, { type: 'OBSERVATION', ...fields }),
      ).toEqual({});
    },
  );

  it.each(
    Object.values(PlantLogType).filter((t) => t !== PlantLogType.OBSERVATION),
  )('rejects the not-yet-supported type %s', async (type) => {
    const errors = await errorsFor(CreatePlantLogDto, { type, notes: 'x' });
    expect(errors.type).toEqual([
      `type ${type} is not supported yet; accepted types: OBSERVATION`,
    ]);
  });

  it.each([undefined, 'observation', 'FOO', 1])(
    'rejects an invalid type %p',
    async (type) => {
      const errors = await errorsFor(CreatePlantLogDto, { type, notes: 'x' });
      expect(errors.type).toBeDefined();
    },
  );

  it.each([0, 6, -1, 2.5, '3', null])(
    'rejects healthScore %p',
    async (healthScore) => {
      const errors = await errorsFor(CreatePlantLogDto, {
        type: 'OBSERVATION',
        notes: 'x',
        healthScore,
      });
      expect(errors.healthScore).toBeDefined();
    },
  );

  it('requires at least one of notes or healthScore', async () => {
    const errors = await errorsFor(CreatePlantLogDto, { type: 'OBSERVATION' });
    expect(errors.notes).toContain(
      'at least one of notes or healthScore is required',
    );
  });

  it.each(['', '   ', null])('rejects empty notes %p', async (notes) => {
    const errors = await errorsFor(CreatePlantLogDto, {
      type: 'OBSERVATION',
      notes,
      healthScore: 3,
    });
    expect(errors.notes).toBeDefined();
  });

  it('trims notes', () => {
    const dto = plainToInstance(CreatePlantLogDto, {
      type: 'OBSERVATION',
      notes: '  hello  ',
    });
    expect(dto.notes).toBe('hello');
  });

  it('rejects notes longer than 2000 characters', async () => {
    const errors = await errorsFor(CreatePlantLogDto, {
      type: 'OBSERVATION',
      notes: 'a'.repeat(2001),
    });
    expect(errors.notes).toBeDefined();
  });

  describe('occurredAt', () => {
    it('rejects a date more than a minute in the future', async () => {
      const future = new Date(Date.now() + 5 * 60_000).toISOString();
      const errors = await errorsFor(CreatePlantLogDto, {
        type: 'OBSERVATION',
        notes: 'x',
        occurredAt: future,
      });
      expect(errors.occurredAt).toEqual([
        'occurredAt must not be in the future',
      ]);
    });

    it('tolerates small client clock skew', async () => {
      const nearFuture = new Date(Date.now() + 10_000).toISOString();
      expect(
        await errorsFor(CreatePlantLogDto, {
          type: 'OBSERVATION',
          notes: 'x',
          occurredAt: nearFuture,
        }),
      ).toEqual({});
    });

    it.each(['2026-11-01', '2026-11-01T10:00:00', 'yesterday', null])(
      'rejects %p (needs ISO 8601 with offset)',
      async (occurredAt) => {
        const errors = await errorsFor(CreatePlantLogDto, {
          type: 'OBSERVATION',
          notes: 'x',
          occurredAt,
        });
        expect(errors.occurredAt).toBeDefined();
      },
    );
  });

  describe('details', () => {
    it('rejects details for OBSERVATION', async () => {
      const errors = await errorsFor(CreatePlantLogDto, {
        type: 'OBSERVATION',
        notes: 'x',
        details: { foo: 1 },
      });
      expect(errors.details).toEqual([
        'details is not accepted for type OBSERVATION',
      ]);
    });

    describe('when a type registers a details DTO', () => {
      class TestDetailsDto {
        @IsString()
        label!: string;
      }

      beforeAll(() => {
        PLANT_LOG_TYPE_CONFIG[PlantLogType.OTHER] = { details: TestDetailsDto };
      });
      afterAll(() => {
        delete PLANT_LOG_TYPE_CONFIG[PlantLogType.OTHER];
      });

      it('validates details against that DTO', async () => {
        const ok = await errorsFor(CreatePlantLogDto, {
          type: 'OTHER',
          notes: 'x',
          details: { label: 'a' },
        });
        expect(ok.details).toBeUndefined();

        const bad = await errorsFor(CreatePlantLogDto, {
          type: 'OTHER',
          notes: 'x',
          details: { label: 1, extra: true },
        });
        expect(bad.details).toHaveLength(1);
        expect(bad.details[0]).toMatch(/^details: /);
        expect(bad.details[0]).toContain('label must be a string');
        expect(bad.details[0]).toContain('property extra should not exist');
      });
    });
  });
});

describe('UpdatePlantLogDto', () => {
  it('accepts an empty body and partial updates', async () => {
    expect(await errorsFor(UpdatePlantLogDto, {})).toEqual({});
    expect(await errorsFor(UpdatePlantLogDto, { healthScore: 2 })).toEqual({});
  });

  it.each(['notes', 'healthScore', 'occurredAt'])(
    'rejects null for %s (fields cannot be cleared)',
    async (field) => {
      const errors = await errorsFor(UpdatePlantLogDto, { [field]: null });
      expect(errors[field]).toBeDefined();
    },
  );

  it('applies the same healthScore and future-date rules as create', async () => {
    const errors = await errorsFor(UpdatePlantLogDto, {
      healthScore: 6,
      occurredAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    });
    expect(errors.healthScore).toBeDefined();
    expect(errors.occurredAt).toEqual(['occurredAt must not be in the future']);
  });

  it('strips type and details (they cannot be changed)', () => {
    const errorsPromise = errorsFor(UpdatePlantLogDto, {
      type: 'WATERING',
      details: {},
    });
    return expect(errorsPromise).resolves.toEqual({});
  });
});
