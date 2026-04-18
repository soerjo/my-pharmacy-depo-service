/*
  Warnings:

  - You are about to drop the column `orgId` on the `RoomCategory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `RoomCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "RoomCategory_orgId_idx";

-- DropIndex
DROP INDEX "RoomCategory_orgId_name_key";

-- AlterTable
ALTER TABLE "RoomCategory" DROP COLUMN "orgId";

-- CreateIndex
CREATE UNIQUE INDEX "RoomCategory_name_key" ON "RoomCategory"("name");
