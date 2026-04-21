import type { Doctor } from '@/features/admin/types/doctor.types';

export interface ClinicalHistoryNote {
    id: string;
    fecha: string;
    estadoSubjetivo: string;
    seguimiento?: Record<string, any>;
    planAjustado?: any;
    proximaCita?: string;
    doctor?: Doctor;
    isDischarge?: boolean;
    horaCita?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClinicalHistoryNoteRequest {
    fecha: string;
    estadoSubjetivo: string;
    cambiosSintomas?: string;
    seguimiento?: Record<string, any>;
    planAjustado?: Record<string, any>;
    proximaCita?: string;
    clinicalHistoryId: string;
    horaCita?: string;
    consultingRoomId?: string;
    isDischarge?: boolean;
}

export type UpdateClinicalHistoryNoteRequest = Partial<CreateClinicalHistoryNoteRequest>;
