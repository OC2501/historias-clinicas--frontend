import { api } from '@/api';
import type {
    Doctor,
    CreateDoctorRequest,
    UpdateDoctorRequest,
    ApiOneResponse,
    ApiAllResponse,
    PaginationParams,
} from '@/types';

export const doctorsApi = {
    getAll: (params?: PaginationParams) =>
        api.get<ApiAllResponse<Doctor>>('/doctor', { params }),

    getById: (id: string) =>
        api.get<ApiOneResponse<Doctor>>(`/doctor/${id}`),

    create: (data: CreateDoctorRequest) =>
        api.post<ApiOneResponse<Doctor>>('/doctor', data),

    update: (id: string, data: UpdateDoctorRequest) =>
        api.patch<ApiOneResponse<Doctor>>(`/doctor/${id}`, data),

    delete: (id: string) =>
        api.delete<ApiOneResponse<Doctor>>(`/doctor/${id}`),
};
