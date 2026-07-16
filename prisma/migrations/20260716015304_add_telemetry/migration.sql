-- AlterTable
ALTER TABLE "habitats" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "telemetries" (
    "id" SERIAL NOT NULL,
    "habitatId" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "vpd" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "telemetries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telemetries_habitatId_recordedAt_idx" ON "telemetries"("habitatId", "recordedAt");

-- AddForeignKey
ALTER TABLE "telemetries" ADD CONSTRAINT "telemetries_habitatId_fkey" FOREIGN KEY ("habitatId") REFERENCES "habitats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
