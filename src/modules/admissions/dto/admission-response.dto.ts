import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdmissionStatus } from '@prisma/client';

export class AdmissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  patientId: string;

  @ApiProperty()
  patientName: string;

  @ApiPropertyOptional()
  patientDateOfBirth: string | null;

  @ApiProperty()
  patientMrn: string;

  @ApiProperty()
  admissionNumber: string;

  @ApiProperty()
  admissionDate: string;

  @ApiPropertyOptional()
  dischargeDate: string | null;

  @ApiPropertyOptional()
  diagnosis: string | null;

  @ApiProperty()
  status: AdmissionStatus;

  @ApiPropertyOptional()
  notes: string | null;

  @ApiPropertyOptional()
  wardId: string | null;

  @ApiPropertyOptional()
  wardName: string | null;

  @ApiPropertyOptional()
  wardTag: string | null;
}

export function mapAdmissionResponse(admission: {
  id: string;
  patientId: string;
  admissionNumber: string;
  admissionDate: Date;
  dischargeDate: Date | null;
  diagnosis: string | null;
  status: AdmissionStatus;
  notes: string | null;
  wardId: string | null;
  patient: { id: string; name: string; dateOfBirth: Date | null; mrn: string } | null;
  ward: { id: string; name: string; type: string } | null;
}): AdmissionResponseDto {
  return {
    id: admission.id,
    patientId: admission.patientId,
    patientName: admission.patient?.name ?? '',
    patientDateOfBirth: admission.patient?.dateOfBirth
      ? admission.patient.dateOfBirth.toISOString()
      : null,
    patientMrn: admission.patient?.mrn ?? '',
    admissionNumber: admission.admissionNumber,
    admissionDate: admission.admissionDate.toISOString(),
    dischargeDate: admission.dischargeDate
      ? admission.dischargeDate.toISOString()
      : null,
    diagnosis: admission.diagnosis,
    status: admission.status,
    notes: admission.notes,
    wardId: admission.ward?.id ?? null,
    wardName: admission.ward?.name ?? null,
    wardTag: admission.ward?.type ?? null,
  };
}
