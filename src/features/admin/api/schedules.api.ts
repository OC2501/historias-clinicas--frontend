import { api } from '@/api';
import type {
    Schedule,
    CreateScheduleRequest,
    UpdateScheduleRequest,
    ApiOneResponse,
    ApiAllResponse,
    PaginationParams,
} from '@/types';

export const schedulesApi = {
    getAll: (params?: PaginationParams) =>
        api.get<ApiAllResponse<Schedule>>('schedule', { params }),

    getById: (id: string) =>
        api.get<ApiOneResponse<Schedule>>(`schedule/${id}`),

    create: (data: CreateScheduleRequest) =>
        api.post<ApiOneResponse<Schedule>>('schedule', data),

    update: (id: string, data: UpdateScheduleRequest) =>
        api.patch<ApiOneResponse<Schedule>>(`schedule/${id}`, data),

    delete: (id: string) =>
        api.delete<ApiOneResponse<Schedule>>(`schedule/${id}`),
};
