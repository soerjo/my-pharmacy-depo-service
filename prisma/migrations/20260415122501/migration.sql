-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('ADMITTED', 'DISCHARGED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('DEPOT', 'WARD', 'DEPARTMENT');

-- CreateEnum
CREATE TYPE "DispenseType" AS ENUM ('INPATIENT', 'OUTPATIENT');

-- CreateEnum
CREATE TYPE "DispenseOrderStatus" AS ENUM ('PENDING', 'DISPENSED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Patient" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "mrn" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "phone" TEXT,
    "address" TEXT,
    "allergies" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admission" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
    "dischargeDate" TIMESTAMP(3),
    "wardId" UUID,
    "diagnosis" TEXT,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'ADMITTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "parentId" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispenseOrder" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "patientId" UUID NOT NULL,
    "admissionId" UUID,
    "type" "DispenseType" NOT NULL,
    "dispensedById" UUID NOT NULL,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "status" "DispenseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationId" UUID,

    CONSTRAINT "DispenseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispenseOrderItem" (
    "id" UUID NOT NULL,
    "dispenseOrderId" UUID NOT NULL,
    "drugId" UUID NOT NULL,
    "drugName" TEXT NOT NULL,
    "batchNumber" TEXT,
    "quantity" INTEGER NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,

    CONSTRAINT "DispenseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Patient_orgId_idx" ON "Patient"("orgId");

-- CreateIndex
CREATE INDEX "Patient_orgId_mrn_idx" ON "Patient"("orgId", "mrn");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_orgId_mrn_key" ON "Patient"("orgId", "mrn");

-- CreateIndex
CREATE INDEX "Admission_orgId_idx" ON "Admission"("orgId");

-- CreateIndex
CREATE INDEX "Admission_orgId_admissionNumber_idx" ON "Admission"("orgId", "admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Admission_orgId_admissionNumber_key" ON "Admission"("orgId", "admissionNumber");

-- CreateIndex
CREATE INDEX "Location_orgId_idx" ON "Location"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_orgId_code_key" ON "Location"("orgId", "code");

-- CreateIndex
CREATE INDEX "DispenseOrder_orgId_idx" ON "DispenseOrder"("orgId");

-- CreateIndex
CREATE INDEX "DispenseOrder_orgId_patientId_idx" ON "DispenseOrder"("orgId", "patientId");

-- CreateIndex
CREATE INDEX "DispenseOrder_orgId_admissionId_idx" ON "DispenseOrder"("orgId", "admissionId");

-- CreateIndex
CREATE INDEX "DispenseOrder_orgId_status_idx" ON "DispenseOrder"("orgId", "status");

-- CreateIndex
CREATE INDEX "DispenseOrderItem_dispenseOrderId_idx" ON "DispenseOrderItem"("dispenseOrderId");

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseOrder" ADD CONSTRAINT "DispenseOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseOrder" ADD CONSTRAINT "DispenseOrder_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseOrder" ADD CONSTRAINT "DispenseOrder_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseOrderItem" ADD CONSTRAINT "DispenseOrderItem_dispenseOrderId_fkey" FOREIGN KEY ("dispenseOrderId") REFERENCES "DispenseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
