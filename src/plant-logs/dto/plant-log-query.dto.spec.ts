import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PlantLogQueryDto } from './plant-log-query.dto';

const errorsFor = async (query: Record<string, unknown>) =>
  (await validate(plainToInstance(PlantLogQueryDto, query))).map(
    (e) => e.property,
  );

describe('PlantLogQueryDto', () => {
  it('accepts no filters', async () => {
    expect(await errorsFor({})).toEqual([]);
  });

  it('accepts from, to and any enum type', async () => {
    expect(
      await errorsFor({
        from: '2026-11-01T00:00:00Z',
        to: '2026-12-01T00:00:00-03:00',
        type: 'WATERING',
      }),
    ).toEqual([]);
  });

  it('rejects dates without offset and unknown types', async () => {
    expect(
      await errorsFor({ from: '2026-11-01', to: 'tomorrow', type: 'FOO' }),
    ).toEqual(['from', 'to', 'type']);
  });
});
