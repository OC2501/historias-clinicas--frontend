import { api } from '@/api/axios';
import type { Organization } from '@/features/admin/types/user.types';

export const organizationsApi = {
    getById: (id: string) => 
        api.get<Organization>(`/organization/${id}`),
    
    update: (id: string, data: Partial<Organization>) => 
        api.patch<Organization>(`/organization/${id}`, data),
};
