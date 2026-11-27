# Gaia Garden API

IoT platform for monitoring indoor grow environments ("habitats"). ESP32 sensors post temperature/humidity; users manage habitats, plants, per-plant log entries, grow events and device API keys.

Stack: NestJS 11 (TypeScript, CommonJS) · Prisma 7 + `@prisma/adapter-pg` · PostgreSQL · JWT + API keys · Jest · Swagger at `/docs`.

## Commands

```bash
npm run dev                  # prisma generate + nest watch (port 3000)
npx tsc --noEmit             # type check
npm run lint                 # eslint --fix
npm test                     # unit tests (jest)
npm test -- src/plants       # single module
npm run test:e2e             # e2e (test/jest-e2e.json)
npx prisma migrate dev --name <name>   # new migration (local DB only)
npx prisma generate          # regenerate client after schema changes
docker compose up -d         # local Postgres on 5432
```

Before calling a task done, run `npx tsc --noEmit` and `npm test`, and both must pass.

## Layout

- `src/<domain>/`: one Nest module per domain, holding `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/` and `*.spec.ts`.
- Domains: `users`, `auth`, `habitat`, `telemetry`, `api-key`, `plants`, `plant-logs`, `events`.
- `telemetry` has two controllers. `TelemetryController` (`/telemetry`) handles ingestion and the legacy reads. `HabitatTelemetryController` + `HabitatTelemetryService` (`/habitat/:habitatId/telemetry`) handle the user-scoped reads: a cursor-paginated list and `/series` aggregation.
- `src/auth/guards/` holds three guards. `JwtGuard` sets `req.user = { userId, username }`. `ApiKeyGuard` reads the `x-api-key` header. `TelemetryAuthGuard` accepts an API key first and falls back to JWT.
- `src/prisma/` holds `PrismaService`, the only database access point.
- `src/generated/prisma/` holds the generated Prisma client. **Never edit it by hand.**
- `prisma/schema.prisma` and `prisma/migrations/` hold the schema and its migrations. Configuration is in `prisma.config.ts`, which reads `DATABASE_URL` from `.env`.

## Domain rules

- **User**: passwords are hashed with bcrypt. Only `confirmed` users can log in. Duplicate usernames return 409.
- **Habitat**: belongs to a User. Every query is scoped by `userId` from the JWT.
- **Telemetry**: the server always computes `vpd` (Tetens equation, kPa, 2 decimals). Never accept `vpd` from the client. Humidity must be 0–100.
  - Ingestion (`POST /telemetry`) goes through `TelemetryService.createAuthorized`. With an API key, `habitatId` comes from the key and the body value is ignored. With a JWT, `habitatId` is required in the body and the habitat must belong to the user, otherwise 404.
  - List (`GET /habitat/:habitatId/telemetry`) uses cursor pagination. The response is `{ data, nextCursor }` and the cursor is opaque base64url of `(recordedAt, id)`. Ordering is `recordedAt desc, id desc`. `limit` defaults to 50 (max 200). `from` is inclusive and `to` is exclusive.
  - Series (`GET /habitat/:habitatId/telemetry/series`) uses `$queryRaw`. It returns avg/min/max/count per `hour` or `day` bucket in an IANA `tz` (default `UTC`). When no bucket is given, ranges up to 48h use `hour` and longer ones use `day`. The maximum range is 90 days. Metrics are whitelisted (`vpd` only for now). Map user input to SQL fragments through constant maps and never interpolate it.
  - `recordedAt` is `TIMESTAMP` without time zone and holds UTC.
  - Date query params must be ISO 8601 **with an offset** (`Z` or `±HH:MM`), enforced by `ISO_DATETIME_WITH_OFFSET`.
- **ApiKey**: format is `gg_live_<32 hex>`. Only the SHA-256 hash is stored, and the plain key is returned once at creation. Delete sets `isActive = false`. `lastUsedAt` is updated on each validation. `TelemetryAuthGuard` puts the key's **habitatId** on `request.apiKeyId` (the name is misleading).
- **Plant / Event**: nested under `habitat/:habitatId/...`. Both use soft delete via `deletedAt`.
- **PlantLog** (`plant_logs`): a dated diary entry for a plant, nested under `habitat/:habitatId/plants/:plantId/logs`. Access is checked with `ensurePlantAccess`, which runs `ensureHabitatAccess` and then confirms the plant is in that habitat and not soft-deleted. Logs use soft delete.
  - Fields: `type` (enum `PlantLogType`), `notes` (≤2000 chars, trimmed), `healthScore` (1–5, also enforced by a DB CHECK constraint), `details` (JSONB, payload specific to the type) and `occurredAt` (defaults to now, max 60s in the future).
  - Create requires `notes` and/or `healthScore`.
  - Only types registered in `PLANT_LOG_TYPE_CONFIG` (`src/plant-logs/plant-log-types.ts`) are accepted on write. Today that is only `OBSERVATION`. The enum already holds every planned type, so enabling one means adding it to the registry plus a `details` DTO, with no migration. `details` is validated against the DTO for its type, and it is rejected for types that have no details DTO.
  - Update changes only `notes`, `healthScore` and `occurredAt`. `type` and `details` cannot be changed, and sending `null` is rejected (`IsOptionalNotNull`).
  - List ordering is `occurredAt desc, id desc`, with optional `from`, `to` and `type` filters.

## Conventions

- **Ownership:** take `userId` from `req.user` (JWT), never from the body or query. Habitat-nested resources call `ensureHabitatAccess(userId, habitatId)` first and return 404 (not 403) when the habitat is not the user's.
- **Soft delete:** filter on `deletedAt: null` when reading. Update and delete use `updateMany`; when `count === 0`, throw `NotFoundException`.
- **Lists:** order by `createdAt desc`. Time-series data orders by its event time with `id desc` as the tie-breaker: telemetry uses `recordedAt` and plant logs use `occurredAt`.
- **Route params:** new controllers use `ParseIntPipe` (`@Param('id', ParseIntPipe) id: number`). Older ones still use `+id`.
- **DTOs:** every input goes through a DTO with `class-validator` decorators and `@ApiProperty`. The global `ValidationPipe` runs with `whitelist` and `transform`. Fields in update DTOs are `@IsOptional()`.
- **Swagger:** controllers get `@ApiTags`. Add `@ApiOperation` and response decorators on new endpoints.
- **Errors:** use Nest HTTP exceptions (`NotFoundException`, `BadRequestException`, `ConflictException`, `UnauthorizedException`). Never return `null` to mean "not found".
- **TypeScript:** strict typing. No `any` and no `@ts-ignore`. Use async/await.
- **Tests:** each service has a `*.spec.ts` that mocks `PrismaService`. New or changed behavior needs a test.
- **Principles:** simplicity first, YAGNI, and the standard Nest module/controller/service pattern. Don't add abstractions such as repositories or base classes unless asked.
- **Dependencies:** check `package.json` first and ask before adding a new one.

## Database / migrations

- After changing `schema.prisma`, run `npx prisma migrate dev --name <descriptive_name>`, then `npx prisma generate`.
- **Never edit a migration that has already been applied.** Create a new one instead.
- Production runs `prisma migrate deploy` (`npm run start:prod`). Never run `migrate reset` or `db push` against a remote database.

## Known gaps (don't assume these are intentional)

- `GET /telemetry`, `GET /telemetry/:id` and `GET /telemetry/:id/last` are not scoped to the user. Use `/habitat/:habitatId/telemetry` for user-facing reads.
- `CreateTelemetryDto` still declares a `vpd` field. The service overwrites it, but the field should be removed.
- `ApiKey.expiresAt` is not enforced, and `GET /api-keys` lists every key, not just the user's.
- Habitat delete is a hard delete with no cascade to children. The FKs are `ON DELETE RESTRICT`, so deleting a habitat that has children fails. The `plant_logs → plants` FK is also RESTRICT.
- Users have no confirmation flow; `confirmed` is set manually.
- Some older specs fail `npx tsc --noEmit`: `events`/`plants` controller specs call `mockRequest()` without an argument, and `telemetry.service.spec` is missing `vpd`. Older specs also fail lint (`any`, `unbound-method`). Jest still runs them because ts-jest is lenient.

## Claude Code setup (`.claude/`)
- Skill `new-nest-module`: recipe for a new module or endpoint (ownership checks, soft delete, DTOs, Swagger, specs).
- Skill `prisma-migration`: safe schema changes. Always use `--create-only` and review the SQL. Write renames as `RENAME COLUMN`, never drop + add.
- Subagent `api-reviewer` (read-only): checks per-user scoping, guards, validation, migrations and tests. **Run it on your diff before you report a change as done.**
- Hooks (`.claude/settings.json`):
  - After every edit, ESLint (`--fix`) runs on the file you changed. Fix any errors it reports.
  - Reading `.env*` (except `.env.example`) is blocked.
  - Editing `src/generated/`, committed migrations, `deploy.sh`, `deploy-gcp.yml` or `package-lock.json` is blocked.
- The domain is **plant-agnostic** (ADR-003). Use generic names in new code and Swagger docs, and write Swagger descriptions in English (ADR-004).
- For a non-trivial task, show a plan before you write code.

## Don'ts

- Don't commit `.env` or credentials. Keep secrets out of `docker-compose*.yml` and workflows.
- Don't touch `.github/workflows/deploy-gcp.yml` or `deploy.sh` unless asked.
- Don't commit or push unless asked. Work on feature branches (`feat/...`), never directly on `main`.
