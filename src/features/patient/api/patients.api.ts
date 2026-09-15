import { api } from '@/api';
import type {
    Patient,
    CreatePatientRequest,
    UpdatePatientRequest,
    ApiOneResponse,
    ApiAllResponse,
    PaginationParams,
} from '@/types';

export const patientsApi = {
    getAll: (params?: PaginationParams) =>
        api.get<ApiAllResponse<Patient>>('patient', { params }),

    getUniqueGerencias: () =>
        api.get<string[]>('patient/gerencias'),

    getById: (id: string) =>
        api.get<ApiOneResponse<Patient>>(`patient/${id}`),

    create: (data: CreatePatientRequest) =>
        api.post<ApiOneResponse<Patient>>('patient', data),

    update: (id: string, data: UpdatePatientRequest) =>
        api.patch<ApiOneResponse<Patient>>(`patient/${id}`, data),

    updateDocuments: (id: string, documents: Record<string, any>[]) =>
        api.patch<ApiOneResponse<Patient>>(`patient/${id}/documents`, { documents }),

    delete: (id: string) =>
        api.delete<ApiOneResponse<Patient>>(`patient/${id}`),

    linkFamilyMember: (titularId: string, data: { memberId: string; relationship: string }) =>
        api.post<ApiOneResponse<Patient>>(`patient/${titularId}/link-family`, data),

    unlinkFamilyMember: (titularId: string, memberId: string) =>
        api.delete<ApiOneResponse<{ success: boolean; message: string }>>(`patient/${titularId}/unlink-family/${memberId}`),
};
