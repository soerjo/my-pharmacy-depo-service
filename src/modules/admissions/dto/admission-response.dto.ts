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
  roomId: string | null;

  @ApiPropertyOptional()
  roomName: string | null;

  @ApiPropertyOptional()
  roomCode: string | null;
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
  roomId: string | null;
  patient: {
    id: string;
    name: string;
    dateOfBirth: Date | null;
    mrn: string;
  } | null;
  room: { id: string; name: string; code: string } | null;
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
    roomId: admission.room?.id ?? null,
    roomName: admission.room?.name ?? null,
    roomCode: admission.room?.code ?? null,
  };
}
