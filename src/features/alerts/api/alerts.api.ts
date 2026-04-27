import { api } from '@/api';
import type { Alert } from '../types/alert.types';

export const alertsApi = {
    getMyAlerts: () =>
        api.get<Alert[]>('alerts/my'),

    getUnreadCount: () =>
        api.get<number>('alerts/my/count'),

    markAsRead: (id: string) =>
        api.post<void>(`alerts/${id}/read`, {}),

    markAllAsRead: () =>
        api.post<void>('alerts/read-all', {}),

    // Admin
    getAll: () =>
        api.get<Alert[]>('alerts'),

    create: (data: { title: string; message: string; type?: string; expiresAt?: string }) =>
        api.post<Alert>('alerts', data),

    remove: (id: string) =>
        api.delete<void>(`alerts/${id}`),
};
