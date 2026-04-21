/*
  Warnings:

  - You are about to drop the column `roomId` on the `DispenseOrder` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DispenseOrder" DROP CONSTRAINT "DispenseOrder_roomId_fkey";

-- AlterTable
ALTER TABLE "DispenseOrder" DROP COLUMN "roomId";
