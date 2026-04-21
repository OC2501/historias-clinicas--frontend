import { SystemRole, OrganizationRole, OrganizationPlanType } from '@/types/enums';
import type { Doctor } from '@/features/admin/types/doctor.types';

export interface Organization {
    id: string;
    name: string;
    planType: OrganizationPlanType;
    type?: string;
    size?: string;
    allowAdminAudit?: boolean;
}

export interface User {
    id: string;
    email: string;
    name: string;
    systemRole: SystemRole;
    organizationRole?: OrganizationRole;
    organization?: Organization;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    doctorProfile?: Doctor;
}

export interface CreateUserRequest {
    email: string;
    password?: string;
    name: string;
    systemRole: SystemRole;
    organizationRole?: OrganizationRole;
}

export type UpdateUserRequest = Partial<CreateUserRequest>;
