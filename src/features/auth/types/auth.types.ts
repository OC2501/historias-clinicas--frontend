import { OrganizationPlanType, OrganizationRole } from '@/types/enums';
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
    phone?: string;
    planType: OrganizationPlanType;
    organizationName?: string;
    organizationType?: string;
    organizationSize?: string;
    organizationRole?: OrganizationRole;
}

export interface LoginResponse {
    user: User;
    token: string;
}
