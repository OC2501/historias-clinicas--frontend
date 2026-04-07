import { api } from '@/api';
import type {
    Appointment,
    CreateAppointmentRequest,
    UpdateAppointmentRequest,
    ApiOneResponse,
    ApiAllResponse,
    PaginationParams,
} from '@/types';

export const appointmentsApi = {
    getAll: (params?: PaginationParams) =>
        api.get<ApiAllResponse<Appointment>>('/appointment', { params }),

    getById: (id: string) =>
        api.get<ApiOneResponse<Appointment>>(`/appointment/${id}`),

    create: (data: CreateAppointmentRequest) =>
        api.post<ApiOneResponse<Appointment>>('/appointment', data),

    update: (id: string, data: UpdateAppointmentRequest) =>
        api.patch<ApiOneResponse<Appointment>>(`/appointment/${id}`, data),

    delete: (id: string) =>
        api.delete<ApiOneResponse<Appointment>>(`/appointment/${id}`),
};
