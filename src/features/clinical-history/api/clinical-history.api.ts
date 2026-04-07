import { api } from '@/api';
import type {
    ClinicalHistory,
    CreateClinicalHistoryRequest,
    UpdateClinicalHistoryRequest,
    ApiOneResponse,
    ApiAllResponse,
    PaginationParams,
} from '@/types';

export const clinicalHistoryApi = {
    getAll: (params?: PaginationParams) =>
        api.get<ApiAllResponse<ClinicalHistory>>('clinical-history', { params }),

    getById: (id: string) =>
        api.get<ApiOneResponse<ClinicalHistory>>(`clinical-history/${id}`),

    create: (data: CreateClinicalHistoryRequest) =>
        api.post<ApiOneResponse<ClinicalHistory>>('clinical-history', data),

    update: (id: string, data: UpdateClinicalHistoryRequest) =>
        api.patch<ApiOneResponse<ClinicalHistory>>(`clinical-history/${id}`, data),

    delete: (id: string) =>
        api.delete<ApiOneResponse<ClinicalHistory>>(`clinical-history/${id}`),
};
