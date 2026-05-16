import { $Enums } from '@prisma/client';

export interface IDispenseOrderItemResponse {
  id: string;
  drugId: string;
  drugName: string | undefined;
  quantity: number;
  instructions: string | null;
  baseUnitId: string | undefined;
  baseUnitName: string | undefined;
  baseUnitCode: string | undefined;
  baseUnitAbbreviation: string | undefined;
}

export interface IGetDispenseOrderResponse {
  id: string;
  orderNumber: string;
  orderDate: Date;
  patientId: string;
  patientName: string;
  mrn: string;
  admissionId: string;
  dispensedAt: Date | null;
  notes: string | null;
  cancelReason: string | null;
  status: $Enums.DispenseOrderStatus;
  createdAt: Date;
  createdBy: string;
  type: $Enums.AdmissionType | null;
  admissionNumber: string | null;
  admissionDate: Date | null;
  roomId: string | null;
  items: IDispenseOrderItemResponse[];
}
