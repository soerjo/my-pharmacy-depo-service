/*
  Warnings:

  - You are about to drop the column `batchNumber` on the `DispenseOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `dosage` on the `DispenseOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `drugName` on the `DispenseOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `frequency` on the `DispenseOrderItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DispenseOrderItem" DROP COLUMN "batchNumber",
DROP COLUMN "dosage",
DROP COLUMN "drugName",
DROP COLUMN "frequency";
