import type { User } from '@/features/admin/types/user.types';

export interface Doctor {
    id: string;
    user?: User;
    specialty?: string;
    licenseNumber?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDoctorRequest {
    userId: string;
    specialty?: string;
    licenseNumber?: string;
}

export type UpdateDoctorRequest = Partial<CreateDoctorRequest>;
