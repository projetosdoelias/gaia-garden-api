import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelemetryListQueryDto } from './dto/telemetry-list-query.dto';
import { TelemetryPageResponseDto } from './dto/telemetry-page-response.dto';
import {
  TelemetryBucket,
  TelemetryMetric,
  TelemetrySeriesQueryDto,
} from './dto/telemetry-series-query.dto';
import {
  TelemetrySeriesPointDto,
  TelemetrySeriesResponseDto,
} from './dto/telemetry-series-response.dto';

const HOUR_MS = 60 * 60 * 1000;
export const AUTO_HOUR_BUCKET_MAX_MS = 48 * HOUR_MS;
export const SERIES_MAX_RANGE_MS = 90 * 24 * HOUR_MS;

/** Whitelists: user input is mapped to these constants, never interpolated. */
const METRIC_COLUMN: Record<TelemetryMetric, Prisma.Sql> = {
  [TelemetryMetric.VPD]: Prisma.sql`"vpd"`,
};
const BUCKET_UNIT: Record<TelemetryBucket, string> = {
  [TelemetryBucket.HOUR]: 'hour',
  [TelemetryBucket.DAY]: 'day',
};

export interface TelemetrySeriesRow {
  bucketStart: Date;
  avg: number;
  min: number;
  max: number;
  count: number;
}

interface TelemetryCursor {
  recordedAt: Date;
  id: number;
}

export function resolveBucket(
  from: Date,
  to: Date,
  requested?: TelemetryBucket,
): TelemetryBucket {
  if (requested) {
    return requested;
  }
  return to.getTime() - from.getTime() <= AUTO_HOUR_BUCKET_MAX_MS
    ? TelemetryBucket.HOUR
    : TelemetryBucket.DAY;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function mapSeriesRow(row: TelemetrySeriesRow): TelemetrySeriesPointDto {
  return {
    bucketStart: new Date(row.bucketStart).toISOString(),
    avg: round2(Number(row.avg)),
    min: round2(Number(row.min)),
    max: round2(Number(row.max)),
    count: Number(row.count),
  };
}

export function encodeCursor(cursor: TelemetryCursor): string {
  return Buffer.from(
    JSON.stringify({ r: cursor.recordedAt.toISOString(), i: cursor.id }),
  ).toString('base64url');
}

export function decodeCursor(raw: string): TelemetryCursor {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(raw, 'base64url').toString('utf8'),
    );
    if (typeof parsed === 'object' && parsed !== null) {
      const { r, i } = parsed as { r?: unknown; i?: unknown };
      const recordedAt = typeof r === 'string' ? new Date(r) : undefined;
      if (
        recordedAt &&
        !isNaN(recordedAt.getTime()) &&
        Number.isInteger(i) &&
        (i as number) > 0
      ) {
        return { recordedAt, id: i as number };
      }
    }
  } catch {
    // fall through
  }
  throw new BadRequestException('Invalid cursor');
}

@Injectable()
export class HabitatTelemetryService {
  constructor(private prisma: PrismaService) {}

  private async ensureHabitatAccess(userId: number, habitatId: number) {
    const habitat = await this.prisma.habitat.findFirst({
      where: { id: habitatId, userId },
      select: { id: true },
    });

    if (!habitat) {
      throw new NotFoundException('Habitat not found');
    }
  }

  async list(
    habitatId: number,
    userId: number,
    query: TelemetryListQueryDto,
  ): Promise<TelemetryPageResponseDto> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to && from >= to) {
      throw new BadRequestException('`from` must be before `to`');
    }
    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;

    await this.ensureHabitatAccess(userId, habitatId);

    const where: Prisma.TelemetryWhereInput = { habitatId };
    if (from || to || cursor) {
      // `lte: cursor` is redundant with the OR below but lets the
      // (habitatId, recordedAt) index start the scan at the cursor.
      where.recordedAt = { gte: from, lt: to, lte: cursor?.recordedAt };
    }
    if (cursor) {
      where.OR = [
        { recordedAt: { lt: cursor.recordedAt } },
        { recordedAt: cursor.recordedAt, id: { lt: cursor.id } },
      ];
    }

    const rows = await this.prisma.telemetry.findMany({
      where,
      orderBy: [{ recordedAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const data = hasMore ? rows.slice(0, query.limit) : rows;
    const last = data[data.length - 1];

    return {
      data,
      nextCursor: hasMore && last ? encodeCursor(last) : null,
    };
  }

  async series(
    habitatId: number,
    userId: number,
    query: TelemetrySeriesQueryDto,
  ): Promise<TelemetrySeriesResponseDto> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (from >= to) {
      throw new BadRequestException('`from` must be before `to`');
    }
    if (to.getTime() - from.getTime() > SERIES_MAX_RANGE_MS) {
      throw new BadRequestException('Range must not exceed 90 days');
    }

    const bucket = resolveBucket(from, to, query.bucket);
    const metric = query.metric;
    const tz = query.tz;

    await this.ensureHabitatAccess(userId, habitatId);

    const column = METRIC_COLUMN[metric];
    const unit = BUCKET_UNIT[bucket];

    // "recordedAt" is TIMESTAMP (no tz) holding UTC. The column stays bare in
    // WHERE so the (habitatId, recordedAt) index is used; bounds are converted
    // to UTC timestamps instead.
    const rows = await this.prisma.$queryRaw<TelemetrySeriesRow[]>`
      SELECT
        (date_trunc(${unit}, ("recordedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})
          AT TIME ZONE ${tz}) AS "bucketStart",
        AVG(${column}) AS "avg",
        MIN(${column}) AS "min",
        MAX(${column}) AS "max",
        COUNT(*)::int AS "count"
      FROM "telemetries"
      WHERE "habitatId" = ${habitatId}
        AND "recordedAt" >= (${from.toISOString()}::timestamptz AT TIME ZONE 'UTC')
        AND "recordedAt" < (${to.toISOString()}::timestamptz AT TIME ZONE 'UTC')
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    return {
      habitatId,
      metric,
      bucket,
      from: from.toISOString(),
      to: to.toISOString(),
      tz,
      points: rows.map(mapSeriesRow),
    };
  }
}
