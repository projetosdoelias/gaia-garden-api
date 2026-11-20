---
name: prisma-migration
description: Safe workflow for changing prisma/schema.prisma in gaia-garden-api (add/rename/drop fields or models), including column renames without data loss, regenerating the client, and updating DTOs, services and tests. Use for any database schema change.
---

# Prisma schema change (gaia-garden-api)

Prisma 7 with `@prisma/adapter-pg`. The config is in `prisma.config.ts` (`DATABASE_URL` comes from `.env`), and the client is generated to `src/generated/prisma` (never edit it).

## Golden rules
- Only run migrations against the **local** database (`docker compose up -d`). Never run `migrate reset`, `db push` or `migrate dev` against a remote or production database. Production runs `prisma migrate deploy` on start.
- **Never edit a migration that's already committed or applied.** Create a new one. A hook blocks edits to committed migration files.
- Migration names are descriptive snake_case: `rename_plant_strain_to_variety`, `add_plant_image_url`.

## Workflow
1. Edit `prisma/schema.prisma`.
2. **Generate the SQL without applying it**, then read it:
   ```bash
   npx prisma migrate dev --create-only --name <descriptive_name>
   ```
3. Review `prisma/migrations/<timestamp>_<name>/migration.sql`:
   - **Renames**: Prisma generates `DROP COLUMN` + `ADD COLUMN`, which **loses data**. Replace it with:
     ```sql
     ALTER TABLE "plants" RENAME COLUMN "strain" TO "variety";
     ```
     Use the table names from `@@map(...)`.
   - **New required column on a table with data**: add it as nullable or with a default first, then backfill it in the same SQL, then set `NOT NULL`.
   - **Drops**: confirm with the user before dropping anything that holds data.
4. Apply and regenerate:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
5. Update every layer that touches the field:
   - DTOs (validators and `@ApiProperty`)
   - service `data` objects and `select`s
   - spec mocks and expectations (`grep -rn "<oldName>" src test`)
6. Verify:
   ```bash
   npx tsc --noEmit && npm test && npm run lint
   ```
7. Tell the user the change is an **API contract change** if any response or request field was renamed. The web BFF client (`gaia-garden-web/src/lib/api/*Client.ts`, plus any mapper) has to be updated in a coordinated change.

## Known pending change
`Plant.strain` → `variety` (plant-agnostic naming, ADR-003). The web app currently maps `variety` ↔ `strain` in its BFF. When this rename ships, the web mapper must be removed in the same release window.
