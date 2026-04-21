/*
  Warnings:

  - You are about to drop the column `type` on the `DispenseOrder` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AdmissionType" AS ENUM ('INPATIENT', 'OUTPATIENT');

-- AlterTable
ALTER TABLE "Admission" ADD COLUMN     "type" "AdmissionType" NOT NULL DEFAULT 'INPATIENT';

-- AlterTable
ALTER TABLE "DispenseOrder" DROP COLUMN "type";

-- DropEnum
DROP TYPE "DispenseType";
