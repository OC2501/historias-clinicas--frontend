import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../api/alerts.api';
import type { Alert } from '../types/alert.types';

const ALERTS_KEY = ['alerts', 'my'];

export function useAlerts() {
    const queryClient = useQueryClient();

    const { data: alerts = [], isLoading } = useQuery<Alert[]>({
        queryKey: ALERTS_KEY,
        queryFn: async () => {
            const res = await alertsApi.getMyAlerts();
            return res.data ?? [];
        },
        staleTime: 1000 * 60, // 1 minuto
    });


    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => alertsApi.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: () => alertsApi.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ALERTS_KEY });
        },
    });

    return {
        alerts,
        unreadCount: alerts.length, // Usamos la longitud del array para consistencia
        isLoading,
        markAsRead: markAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
        isMarkingRead: markAsReadMutation.isPending || markAllAsReadMutation.isPending,
    };
}
