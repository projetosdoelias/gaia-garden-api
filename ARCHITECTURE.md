# Gaia Garden Architecture

## Current Domains

- Habitat
- Telemetry

Future:

- Device
- Plant
- Observation
- Analytics
- AI Insights

## Stack

- NestJS
- Prisma
- PostgreSQL

## Principles

- Simplicity first
- YAGNI
- Keep the MVP focused
- Telemetry is append-only
- PostgreSQL is the source of truth
- Analytics will consume PostgreSQL
- AI will consume Analytics

## Current Flow

ESP32

↓

POST /telemetries

↓

NestJS

↓

Prisma

↓

PostgreSQL
