# Gaia Garden Architecture

## Stack

- NestJS
- Prisma
- PostgreSQL

## Domains

### Habitat

- Manages indoor environments (Habitats)
- Fields: id, title, description, createdAt, updatedAt

### Telemetry

- Stores sensor data from ESP32 devices
- Fields: id, habitatId, recordedAt, temperature, humidity, vpd

### ApiKey

- Manages API keys for device authentication
- Fields: id, name, keyHash, isActive, lastUsedAt, expiresAt, createdAt, updatedAt, habitatId
- Endpoints:
  - POST /api-keys: Create a new API key
  - DELETE /api-keys/:id: Deactivate an API key
- Authentication:
  - Validates `x-api-key` header
  - Attaches Habitat to request if valid

## Principles

- Simplicity first
- YAGNI
- Keep the original nestjs architecture pattern
