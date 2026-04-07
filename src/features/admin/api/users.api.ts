import { api } from '@/api';
import type {
    User,
    CreateUserRequest,
    UpdateUserRequest,
    ApiOneResponse,
    ApiAllResponse,
    PaginationParams,
} from '@/types';

export const usersApi = {
    getAll: (params?: PaginationParams) =>
        api.get<ApiAllResponse<User>>('/users', { params }),

    getById: (id: string) =>
        api.get<ApiOneResponse<User>>(`/users/${id}`),

    create: (data: CreateUserRequest) =>
        api.post<ApiOneResponse<User>>('/users', data),

    update: (id: string, data: UpdateUserRequest) =>
        api.patch<ApiOneResponse<User>>(`/users/${id}`, data),

    delete: (id: string) =>
        api.delete<ApiOneResponse<User>>(`/users/${id}`),
};
