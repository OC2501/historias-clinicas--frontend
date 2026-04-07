import { UserRole } from '@/types/enums';
import type { User } from '@/types';

// ===== AUTH =====
export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    role: UserRole;
}

export interface LoginResponse {
    user: User;
    token: string;
}
