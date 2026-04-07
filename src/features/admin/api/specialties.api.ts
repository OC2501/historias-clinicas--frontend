import { api } from '@/api';
import type {
    SpecialtyTemplate,
    CreateSpecialtyRequest,
    UpdateSpecialtyRequest,
    ApiOneResponse,
    ApiAllResponse,
    PaginationParams,
} from '@/types';

export const specialtiesApi = {
    getAll: (params?: PaginationParams) =>
        api.get<ApiAllResponse<SpecialtyTemplate>>('/specialty', { params }),

    getById: (id: string) =>
        api.get<ApiOneResponse<SpecialtyTemplate>>(`/specialty/${id}`),

    // Buscar plantilla por nombre de especialidad (ej: 'NEUMONOLOGIA')
    getBySpecialty: (specialty: string) =>
        api.get<ApiOneResponse<SpecialtyTemplate>>(`/specialty/specialty/${specialty}`),

    create: (data: CreateSpecialtyRequest) =>
        api.post<ApiOneResponse<SpecialtyTemplate>>('/specialty', data),

    update: (id: string, data: UpdateSpecialtyRequest) =>
        api.patch<ApiOneResponse<SpecialtyTemplate>>(`/specialty/${id}`, data),

    delete: (id: string) =>
        api.delete<ApiOneResponse<SpecialtyTemplate>>(`/specialty/${id}`),
};
