import { api } from '@/api';
import type { LoginRequest, RegisterRequest, LoginResponse } from '@/types';
import type { ApiOneResponse } from '@/types';

export const authApi = {
    login: (data: LoginRequest) =>
        api.post<LoginResponse>('auth/login', data),

    register: (data: RegisterRequest) =>
        api.post<ApiOneResponse<any>>('auth/register', data),

    forgotPassword: (email: string) =>
        api.post<{ message: string }>('auth/forgot-password', { email }),

    resetPassword: (data: any) =>
        api.post<{ message: string }>('auth/reset-password', data),

    getMaintenanceStatus: () =>
        api.get<{ active: boolean }>('auth/maintenance-status'),

    getSecurityQuestions: (identifier: string) =>
        api.get<{ question1: string; question2: string }>('auth/security-questions', {
            params: { identifier },
        }),

    verifySecurityAnswers: (data: {
        identifier: string;
        answer1: string;
        answer2: string;
        action: 'password' | 'username' | 'email';
    }) =>
        api.post<{ token?: string; username?: string; email?: string }>(
            'auth/verify-security-answers',
            data
        ),
};
