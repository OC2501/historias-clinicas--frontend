import { api } from '@/api';
import type {
    Configuration,
    CreateConfigurationRequest,
    UpdateConfigurationRequest,
    ApiOneResponse,
    ApiAllResponse,
    PaginationParams,
} from '@/types';

export const configurationApi = {
    getAll: (params?: PaginationParams) =>
        api.get<ApiAllResponse<Configuration>>('/configuration', { params }),

    getById: (id: string) =>
        api.get<ApiOneResponse<Configuration>>(`/configuration/${id}`),

    create: (data: CreateConfigurationRequest) =>
        api.post<ApiOneResponse<Configuration>>('/configuration', data),

    update: (id: string, data: UpdateConfigurationRequest) =>
        api.patch<ApiOneResponse<Configuration>>(`/configuration/${id}`, data),

    delete: (id: string) =>
        api.delete<ApiOneResponse<Configuration>>(`/configuration/${id}`),
};
