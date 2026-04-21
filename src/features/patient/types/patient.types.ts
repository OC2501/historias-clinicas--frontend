import { Gender } from '@/types/enums';

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
    createdBy?: { id: string; name: string };
    doctor?: { id: string; user?: { name: string }; specialty?: string };
    status?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;

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
}

export type UpdatePatientRequest = Partial<CreatePatientRequest>;
