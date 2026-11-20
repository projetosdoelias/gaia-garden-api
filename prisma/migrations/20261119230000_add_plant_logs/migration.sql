-- CreateEnum
CREATE TYPE "PlantLogType" AS ENUM ('OBSERVATION', 'WATERING', 'FEEDING', 'PRUNING', 'TRAINING', 'TRANSPLANT', 'STAGE_CHANGE', 'OTHER');

-- CreateTable
CREATE TABLE "plant_logs" (
    "id" SERIAL NOT NULL,
    "plantId" INTEGER NOT NULL,
    "type" "PlantLogType" NOT NULL,
    "notes" TEXT,
    "healthScore" INTEGER,
    "details" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "plant_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "plant_logs_plantId_occurredAt_idx" ON "plant_logs"("plantId", "occurredAt");

-- CreateIndex
CREATE INDEX "plant_logs_plantId_type_occurredAt_idx" ON "plant_logs"("plantId", "type", "occurredAt");

-- AddForeignKey
ALTER TABLE "plant_logs" ADD CONSTRAINT "plant_logs_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddCheckConstraint (not modeled by Prisma)
ALTER TABLE "plant_logs" ADD CONSTRAINT "plant_logs_healthScore_check" CHECK ("healthScore" IS NULL OR "healthScore" BETWEEN 1 AND 5);
