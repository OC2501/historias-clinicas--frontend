import { UserRole } from '@/types/enums';
import type { Doctor } from '@/features/admin/types/doctor.types';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    doctorProfile?: Doctor;
}

export interface CreateUserRequest {
    email: string;
    password?: string;
    name: string;
    role: UserRole;
}

export type UpdateUserRequest = Partial<CreateUserRequest>;
