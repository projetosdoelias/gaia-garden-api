-- Add plants and events tables with relations to habitats.
-- This migration only touches the new models and does not modify unrelated
-- database models or existing migrations.

-- CreateTable
CREATE TABLE "plants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "strain" TEXT,
    "germinatedAt" TIMESTAMP(3),
    "seedlingAt" TIMESTAMP(3),
    "vegetativeAt" TIMESTAMP(3),
    "floweringAt" TIMESTAMP(3),
    "habitatId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "plants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "habitatId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "plants" ADD CONSTRAINT "plants_habitatId_fkey" FOREIGN KEY ("habitatId") REFERENCES "habitats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_habitatId_fkey" FOREIGN KEY ("habitatId") REFERENCES "habitats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;