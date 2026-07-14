/*
  Warnings:

  - You are about to drop the `Habitat` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Habitat";

-- CreateTable
CREATE TABLE "habitats" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "habitats_pkey" PRIMARY KEY ("id")
);
