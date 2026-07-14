-- CreateTable
CREATE TABLE "Habitat" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Habitat_pkey" PRIMARY KEY ("id")
);
