import { api } from '@/api';
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/types';
import type { ApiOneResponse } from '@/types';

export const authApi = {
    login: (data: LoginRequest) =>
        api.post<LoginResponse>('auth/login', data),

    register: (data: RegisterRequest) =>
        api.post<ApiOneResponse<any>>('auth/register', data),
};
