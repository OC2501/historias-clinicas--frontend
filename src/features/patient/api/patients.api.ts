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

    getById: (id: string) =>
        api.get<ApiOneResponse<Patient>>(`patient/${id}`),

    create: (data: CreatePatientRequest) =>
        api.post<ApiOneResponse<Patient>>('patient', data),

    update: (id: string, data: UpdatePatientRequest) =>
        api.patch<ApiOneResponse<Patient>>(`patient/${id}`, data),

    delete: (id: string) =>
        api.delete<ApiOneResponse<Patient>>(`patient/${id}`),
};
