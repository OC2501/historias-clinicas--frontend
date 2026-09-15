import type { Patient, PatientDocument } from '@/features/patient/types/patient.types';
import type { Doctor } from '@/features/admin/types/doctor.types';
import type { ClinicalHistoryNote } from '@/features/clinical-history/types/clinical-history-note.types';

// ===== Datos del formulario dinámico =====
export interface FormData {
    motivoConsulta?: string;
    enfermedadActual?: string;
    antecedentesPersonales?: string | Record<string, any>;
    antecedentesFamiliares?: string | Record<string, any>;
    habitosPsicobiologicos?: string | Record<string, any>;
    habitos?: string | Record<string, any>;
    diagnosticos?: string[];
    planManejo?: Record<string, any>;
    datosEspecificos?: Record<string, any>;
    examenFisico?: Record<string, any>;
    documents?: PatientDocument[];
}

export interface ClinicalHistory {
    id: string;
    fecha: string;
    specialty: string;
    templateId?: string;
    motivoConsulta?: string;
    enfermedadActual?: string;
    antecedentesPersonales?: string | Record<string, any>;
    antecedentesFamiliares?: string | Record<string, any>;
    habitos?: string | Record<string, any>;
    examenFisico?: Record<string, any>;
    datosEspecificos?: Record<string, any>;
    diagnosticos?: string[];
    planManejo?: any;
    documents?: PatientDocument[];
    patient: Patient;
    doctor: Doctor;
    notes?: ClinicalHistoryNote[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateClinicalHistoryRequest {
    fecha: string;        // ISO date string
    patientId: string;
    doctorId: string;
    specialty: string;    // 'NEUMONOLOGIA', 'CARDIOLOGIA', etc.
    templateId?: string;
    formData?: FormData;
    documents?: PatientDocument[];
}

export type UpdateClinicalHistoryRequest = Partial<CreateClinicalHistoryRequest>;
