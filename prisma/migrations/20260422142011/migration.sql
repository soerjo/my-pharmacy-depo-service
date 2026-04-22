/*
  Warnings:

  - Made the column `admissionId` on table `DispenseOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DispenseOrder" DROP CONSTRAINT "DispenseOrder_admissionId_fkey";

-- AlterTable
ALTER TABLE "DispenseOrder" ALTER COLUMN "admissionId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "DispenseOrder" ADD CONSTRAINT "DispenseOrder_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
