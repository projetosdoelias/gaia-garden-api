---
name: new-nest-module
description: Recipe for adding a new domain module (or a new endpoint on an existing one) to gaia-garden-api, following the plants/events patterns: controller, service with ownership checks, DTOs with class-validator and Swagger, soft delete, and Jest specs. Use when creating a resource, CRUD or endpoint in the NestJS API.
---

# New Nest module (gaia-garden-api)

Reference implementation: `src/plants/` (controller, service, DTOs, specs). Copy its structure.
The domain stays **plant-agnostic** (ADR-003): use generic names (habitat, plant, stage, event), never crop-specific ones.

## 0. Before coding
- Confirm the contract with the user: routes, fields, which fields are required, who owns the resource, and whether it's soft or hard delete.
- If the schema changes, follow the **prisma-migration** skill first.

## 1. Files
```
src/<domain>/
  <domain>.module.ts        # imports PrismaModule, registers controller + service
  <domain>.controller.ts    # thin: params/req -> service
  <domain>.service.ts       # all logic, all Prisma access
  dto/create-<entity>.dto.ts
  dto/update-<entity>.dto.ts
  <domain>.controller.spec.ts
  <domain>.service.spec.ts
  dto/create-<entity>.dto.spec.ts   # when validation rules are non-trivial
```
Register the module in `src/app.module.ts`.

## 2. Controller
- Add `@ApiTags('<domain>')` and `@UseGuards(JwtGuard)` (or `TelemetryAuthGuard` / `ApiKeyGuard` when devices call it).
- Habitat-scoped resources nest under `@Controller('habitat/:habitatId/<domain>')`.
- Take `userId` from `req.user.userId` only, never from the body or query.
- Convert params with `ParseIntPipe` (`@Param('id', ParseIntPipe) id: number`). It rejects `"12abc"`, which `+id` silently turns into `NaN`. Prefer it in new code, and leave existing modules alone unless asked.
- Add `@ApiOperation` plus response decorators (`@ApiOkResponse`, `@ApiNotFoundResponse`, …) on every endpoint.

## 3. Service
- Start every method on a habitat-scoped resource with `await this.ensureHabitatAccess(userId, habitatId)`. It throws `NotFoundException('Habitat not found')`, a 404 rather than a 403, so the API doesn't reveal which IDs exist.
- Reads filter on `deletedAt: null` and order by `createdAt: 'desc'`.
- Update and soft delete use `updateMany({ where: { id, habitatId, deletedAt: null } })`. When `count === 0`, throw `NotFoundException`. Return the fresh row afterwards. A soft delete returns `{ deleted: true }`.
- Convert ISO date strings to `Date` in one private helper.
- Throw Nest HTTP exceptions. Never return `null` to mean "not found".

## 4. DTOs
- Use `class-validator` on every field and add `@ApiProperty` with an English description, an example, and `required` where applicable.
- Dates: `@IsISO8601()` (the plants DTOs only use `@IsString`, a known gap). Strings: `@MaxLength` where it makes sense.
- Every field in an update DTO is `@IsOptional()`. Keep the update rules consistent with create.
- The global `ValidationPipe` (`whitelist`, `transform`) strips unknown fields. Don't rely on client-sent ownership fields.

## 5. Tests (required)
- Service spec: mock `PrismaService` with `jest.fn()` methods, as in `plants.service.spec.ts`. Cover:
  - the happy path for each method
  - a habitat owned by another user (404, and Prisma write **not** called)
  - not found / soft-deleted
  - the exact `where` clauses, including `deletedAt: null`
- Controller spec: verify it passes `userId` from `req.user` and converts params.
- DTO spec when validation is non-trivial (`validate(plainToInstance(...))`).

## 6. Verify
```bash
npx tsc --noEmit
npm test -- src/<domain>
npm test
npm run lint
```
Then run the **api-reviewer** subagent on the diff before you report the task as done. Check Swagger at `/docs` if the server is running.
