import { $Enums } from "@prisma/client";

export interface IGetDispenseOrderResponse {
    id: string;
    orderNumber: string;
    orderDate: Date;
    patientId: string;
    patientName: string;
    admissionId: string;
    dispensedAt: Date | null;
    notes: string | null;
    cancelReason: string | null;
    status: $Enums.DispenseOrderStatus;
    createdAt: Date;
    createdBy: string;
    type: $Enums.AdmissionType;
    admissionNumber: string;
    admissionDate: Date;
    roomId: string | null;
}