/*
  Warnings:

  - You are about to drop the column `wardId` on the `Admission` table. All the data in the column will be lost.
  - You are about to drop the column `locationId` on the `DispenseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `DispenseOrderItem` table. All the data in the column will be lost.
  - You are about to drop the `Location` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[orgId,orderNumber]` on the table `DispenseOrder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderNumber` to the `DispenseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `DispenseOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANED');

-- AlterEnum
ALTER TYPE "DispenseOrderStatus" ADD VALUE 'PREPARING';

-- DropForeignKey
ALTER TABLE "Admission" DROP CONSTRAINT "Admission_wardId_fkey";

-- DropForeignKey
ALTER TABLE "DispenseOrder" DROP CONSTRAINT "DispenseOrder_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_parentId_fkey";

-- AlterTable
ALTER TABLE "Admission" DROP COLUMN "wardId",
ADD COLUMN     "roomId" UUID;

-- AlterTable
ALTER TABLE "DispenseOrder" DROP COLUMN "locationId",
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "orderNumber" TEXT NOT NULL,
ADD COLUMN     "roomId" UUID,
ALTER COLUMN "dispensedById" DROP NOT NULL,
ALTER COLUMN "dispensedAt" DROP NOT NULL,
ALTER COLUMN "dispensedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "DispenseOrderItem" DROP COLUMN "duration",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Location";

-- DropEnum
DROP TYPE "LocationType";

-- CreateTable
CREATE TABLE "RoomCategory" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isIntensive" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomClass" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "basePrice" DECIMAL(15,2) DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "floor" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomCategory_orgId_idx" ON "RoomCategory"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomCategory_orgId_name_key" ON "RoomCategory"("orgId", "name");

-- CreateIndex
CREATE INDEX "RoomClass_orgId_idx" ON "RoomClass"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomClass_orgId_name_key" ON "RoomClass"("orgId", "name");

-- CreateIndex
CREATE INDEX "Room_orgId_idx" ON "Room"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Room_orgId_code_key" ON "Room"("orgId", "code");

-- CreateIndex
CREATE INDEX "Bed_orgId_idx" ON "Bed"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_orgId_roomId_bedNumber_key" ON "Bed"("orgId", "roomId", "bedNumber");

-- CreateIndex
CREATE INDEX "DispenseOrder_orgId_orderNumber_idx" ON "DispenseOrder"("orgId", "orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DispenseOrder_orgId_orderNumber_key" ON "DispenseOrder"("orgId", "orderNumber");

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RoomCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_classId_fkey" FOREIGN KEY ("classId") REFERENCES "RoomClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseOrder" ADD CONSTRAINT "DispenseOrder_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
