import { Gender, PatientType, RelationshipType } from '@/types/enums';

export interface PatientDocument {
    id: string;
    name: string;
    url: string;
    fileType: string;
    size: number;
    category: string;
    createdAt: string;
    clinicalHistoryId?: string;
    clinicalHistorySpecialty?: string;
    clinicalHistoryDate?: string;
    noteId?: string;
    noteDate?: string;
}

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    gender: Gender;
    phone?: string;
    address?: string;
    identificationNumber?: string;
    email?: string;
    photoUrl?: string;
    documents?: PatientDocument[];
    createdBy?: { id: string; name: string };
    doctor?: { id: string; user?: { name: string }; specialty?: string };
    status?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    gerencia?: string;
    cargo?: string;
    patientType?: PatientType;
    relationship?: RelationshipType;
    titular?: Patient;
    familyMembers?: Patient[];
    titularId?: string;
}

export interface CreatePatientRequest {
    firstName: string;
    lastName: string;
    birthDate: string; // ISO date string
    gender: Gender;
    phone?: string;
    address?: string;
    identificationNumber?: string;
    email?: string;
    doctorId?: string;
    photoUrl?: string;
    documents?: PatientDocument[];
    gerencia?: string;
    cargo?: string;
    patientType?: PatientType;
    relationship?: RelationshipType;
    titularId?: string;
}

export type UpdatePatientRequest = Partial<CreatePatientRequest>;
