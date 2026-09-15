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
    username?: string;
    name: string;
    systemRole: SystemRole;
    organizationRole?: OrganizationRole;
    organization?: Organization;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    doctorProfile?: Doctor;
    securityQuestion1?: string;
    securityQuestion2?: string;
}

export interface CreateUserRequest {
    email: string;
    username?: string;
    password?: string;
    name: string;
    systemRole: SystemRole;
    organizationRole?: OrganizationRole;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
    securityQuestion1?: string;
    securityAnswer1?: string;
    securityQuestion2?: string;
    securityAnswer2?: string;
}
