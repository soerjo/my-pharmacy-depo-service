/*
  Warnings:

  - You are about to drop the column `dispensedById` on the `DispenseOrder` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `DispenseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `DispenseOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `DispenseOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `DispenseOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DispenseOrder" DROP COLUMN "dispensedById",
ADD COLUMN     "createdBy" UUID NOT NULL,
ADD COLUMN     "updatedBy" UUID NOT NULL;

-- AlterTable
ALTER TABLE "DispenseOrderItem" ADD COLUMN     "createdBy" UUID NOT NULL,
ADD COLUMN     "updatedBy" UUID NOT NULL;
