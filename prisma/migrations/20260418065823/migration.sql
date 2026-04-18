/*
  Warnings:

  - You are about to drop the column `classId` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the `Bed` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomClass` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Bed" DROP CONSTRAINT "Bed_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_classId_fkey";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "classId";

-- DropTable
DROP TABLE "Bed";

-- DropTable
DROP TABLE "RoomClass";
