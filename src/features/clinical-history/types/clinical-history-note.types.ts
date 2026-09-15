import type { Doctor } from '@/features/admin/types/doctor.types';
import type { Patient, PatientDocument } from '@/features/patient/types/patient.types';
import type { ClinicalHistory } from './clinical-history.types';

export interface ClinicalHistoryNote {
    id: string;
    fecha: string;
    estadoSubjetivo: string;
    objetivo?: string;
    diagnostico?: string;
    tratamientoActual?: string;
    cambiosSintomas?: string;
    seguimiento?: Record<string, any>;
    planAjustado?: any;
    proximaCita?: string;
    doctor?: Doctor;
    isDischarge?: boolean;
    horaCita?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    patient?: Patient;
    clinicalHistory?: ClinicalHistory;
    clinicalHistoryId?: string;
    documents?: PatientDocument[];
}

export interface CreateClinicalHistoryNoteRequest {
    fecha: string;
    estadoSubjetivo: string;
    objetivo?: string;
    diagnostico?: string;
    tratamientoActual?: string;
    cambiosSintomas?: string;
    seguimiento?: Record<string, any>;
    planAjustado?: Record<string, any>;
    proximaCita?: string;
    clinicalHistoryId: string;
    horaCita?: string;
    consultingRoomId?: string;
    isDischarge?: boolean;
    documents?: PatientDocument[];
}

export type UpdateClinicalHistoryNoteRequest = Partial<CreateClinicalHistoryNoteRequest>;
