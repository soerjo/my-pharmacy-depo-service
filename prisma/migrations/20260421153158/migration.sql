-- AlterTable
ALTER TABLE "DispenseOrder" ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "DispenseOrderItem" ALTER COLUMN "updatedBy" DROP NOT NULL;
