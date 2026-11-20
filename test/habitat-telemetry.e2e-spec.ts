import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { createHash } from 'crypto';
import { PrismaService } from './../src/prisma/prisma.service';

/**
 * Auth/ownership/validation e2e for /habitat/:habitatId/telemetry.
 * PrismaService is mocked so this runs without a database; the SQL itself is
 * covered by manual verification against Postgres.
 */
describe('Habitat telemetry (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  const OWNER_ID = 1;
  const OWN_HABITAT = 10;
  const OTHER_HABITAT = 20;
  const VALID_KEY = 'gg_live_' + 'a'.repeat(32);
  const VALID_KEY_HASH = createHash('sha256').update(VALID_KEY).digest('hex');

  const prisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    habitat: {
      findFirst: jest.fn(
        ({ where }: { where: { id: number; userId: number } }) =>
          Promise.resolve(
            where.id === OWN_HABITAT && where.userId === OWNER_ID
              ? { id: OWN_HABITAT }
              : null,
          ),
      ),
    },
    telemetry: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 1, ...data }),
      ),
    },
    apiKey: {
      findUnique: jest.fn(),
      // The only valid key belongs to OTHER_HABITAT (owned by someone else).
      findFirst: jest.fn(({ where }: { where: { keyHash: string } }) =>
        Promise.resolve(
          where.keyHash === VALID_KEY_HASH
            ? { id: 1, habitatId: OTHER_HABITAT }
            : null,
        ),
      ),
      update: jest.fn(),
    },
    $queryRaw: jest.fn().mockResolvedValue([
      {
        bucketStart: new Date('2026-11-01T03:00:00Z'),
        avg: 1.1665,
        min: 1,
        max: 1.333,
        count: 2,
      },
    ]),
  };

  const series = (habitatId: number, qs: string) =>
    request(app.getHttpServer()).get(
      `/habitat/${habitatId}/telemetry/series?${qs}`,
    );
  const RANGE = 'from=2026-11-01T00:00:00.000Z&to=2026-11-02T00:00:00.000Z';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    token = await app
      .get(JwtService)
      .signAsync({ userId: OWNER_ID, username: 'owner' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth', () => {
    it('401 without token (series)', () =>
      series(OWN_HABITAT, RANGE).expect(401));

    it('401 without token (list)', () =>
      request(app.getHttpServer())
        .get(`/habitat/${OWN_HABITAT}/telemetry`)
        .expect(401));

    it('401 with an API key only (no API key access)', () =>
      series(OWN_HABITAT, RANGE)
        .set('x-api-key', 'gg_live_0123456789abcdef0123456789abcdef')
        .expect(401));

    it('401 with an invalid token', () =>
      series(OWN_HABITAT, RANGE)
        .set('Authorization', 'Bearer not-a-jwt')
        .expect(401));
  });

  describe('ownership', () => {
    it("404 for another user's habitat (series)", () =>
      series(OTHER_HABITAT, RANGE)
        .set('Authorization', `Bearer ${token}`)
        .expect(404));

    it("404 for another user's habitat (list)", () =>
      request(app.getHttpServer())
        .get(`/habitat/${OTHER_HABITAT}/telemetry`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404));

    it('ignores a userId sent in the query', async () => {
      await series(OTHER_HABITAT, `${RANGE}&userId=2`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('validation', () => {
    it.each([
      ['missing range', ''],
      ['from >= to', 'from=2026-11-02T00:00:00Z&to=2026-11-01T00:00:00Z'],
      ['range > 90 days', 'from=2026-01-01T00:00:00Z&to=2026-06-01T00:00:00Z'],
      ['bad bucket', `${RANGE}&bucket=week`],
      ['bad metric', `${RANGE}&metric=temperature`],
      ['bad tz', `${RANGE}&tz=Mars%2FBase`],
      ['offset tz', `${RANGE}&tz=%2B01%3A00`],
    ])('400 for %s', (_label, qs) =>
      series(OWN_HABITAT, qs)
        .set('Authorization', `Bearer ${token}`)
        .expect(400),
    );

    it('400 for non-numeric habitatId', () =>
      series(Number.NaN, RANGE)
        .set('Authorization', `Bearer ${token}`)
        .expect(400));

    it.each([['limit=0'], ['limit=201'], ['cursor=garbage']])(
      '400 for list %s',
      (qs) =>
        request(app.getHttpServer())
          .get(`/habitat/${OWN_HABITAT}/telemetry?${qs}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(400),
    );
  });

  describe('happy path', () => {
    it('200 series with defaults and rounded points', async () => {
      const res = await series(OWN_HABITAT, `${RANGE}&tz=America%2FSao_Paulo`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({
        habitatId: OWN_HABITAT,
        metric: 'vpd',
        bucket: 'hour',
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-02T00:00:00.000Z',
        tz: 'America/Sao_Paulo',
        points: [
          {
            bucketStart: '2026-11-01T03:00:00.000Z',
            avg: 1.17,
            min: 1,
            max: 1.33,
            count: 2,
          },
        ],
      });
    });

    it('200 list with { data, nextCursor }', async () => {
      const res = await request(app.getHttpServer())
        .get(`/habitat/${OWN_HABITAT}/telemetry?limit=10`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual({ data: [], nextCursor: null });
      expect(prisma.telemetry.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ take: 11 }),
      );
    });
  });
  describe('POST /telemetry (JWT and API key both accepted)', () => {
    const reading = { temperature: 25, humidity: 60 };
    const post = () => request(app.getHttpServer()).post('/telemetry');

    beforeEach(() => prisma.telemetry.create.mockClear());

    it('401 without JWT or API key', () => post().send(reading).expect(401));

    it('401 with an invalid API key', () =>
      post().set('x-api-key', 'gg_live_bad').send(reading).expect(401));

    it('JWT: 201 on own habitat', async () => {
      const res = await post()
        .set('Authorization', `Bearer ${token}`)
        .send({ ...reading, habitatId: OWN_HABITAT })
        .expect(201);
      expect((res.body as { habitatId: number }).habitatId).toBe(OWN_HABITAT);
    });

    it("JWT: 404 on another user's habitat, nothing written", async () => {
      await post()
        .set('Authorization', `Bearer ${token}`)
        .send({ ...reading, habitatId: OTHER_HABITAT })
        .expect(404);
      expect(prisma.telemetry.create).not.toHaveBeenCalled();
    });

    it('JWT: 400 without habitatId', () =>
      post().set('Authorization', `Bearer ${token}`).send(reading).expect(400));

    it('API key: 201, habitat comes from the key (body habitatId ignored)', async () => {
      const res = await post()
        .set('x-api-key', VALID_KEY)
        .send({ ...reading, habitatId: OWN_HABITAT })
        .expect(201);
      expect((res.body as { habitatId: number }).habitatId).toBe(OTHER_HABITAT);
    });
  });
});
